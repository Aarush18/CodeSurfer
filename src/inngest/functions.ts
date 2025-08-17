import { z } from "zod";
import { inngest } from "./client";
import { openai, createAgent, createTool, createNetwork, type Tool } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import {
  getSandbox,
  detectRootDir,
  detectAppDir,
  ensureDevServer,
  LastAssistantTextMessageContent,
} from "./utils";
import { PROMPT } from "@/prompt";
import prisma from "@/lib/db";

interface AgentState{
  summary: string;
  files:{[path:string]:string}
};

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    // 1) create sandbox once
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("surf-nextjs-test-2");
      return sandbox.sandboxId;
    });

    // 2) detect root + app dir (used by tools & ensure step)
    const rootDir = await step.run("detect-root", async () => detectRootDir(sandboxId));
    const appDir = await step.run("detect-app-dir", async () => detectAppDir(sandboxId, rootDir));

    // 3) agent
    const codeAgent = createAgent<AgentState>({
      name: "codeAgent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        defaultParameters: { temperature: 0.1 },
      }),
      tools: [
        // terminal
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({ command: z.string() }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (d: string) => (buffers.stdout += d),
                  onStderr: (d: string) => (buffers.stderr += d),
                });
                return result.stdout;
              } catch (error) {
                console.error(
                  `Command failed : ${error} \nstdout : ${buffers.stdout} \nstderr : ${buffers.stderr}`
                );
                return `Command failed : ${error} \nstdout : ${buffers.stdout} \nstderr : ${buffers.stderr}`;
              }
            });
          },
        }),

        // create/update files (root + app aware)
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(), // relative path expected (e.g. "app/page.tsx")
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files }, { step, network }:Tool.Options<AgentState>

          ) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const sb = await getSandbox(sandboxId);
                const updated: Record<string, { path: string; content: string }> =
                  (network.state.data.files as any) || {};

                for (const f of files) {
                  // rewrite if project uses src/app
                  const rel =
                    f.path.startsWith("app/") && appDir !== "app"
                      ? f.path.replace(/^app\//, `${appDir}/`)
                      : f.path;

                  const full = `${rootDir}/${rel}`;
                  const idx = full.lastIndexOf("/");
                  if (idx > 0) {
                    const dir = full.slice(0, idx);
                    await sb.commands.run(`mkdir -p "${dir}"`);
                  }
                  await sb.files.write(full, f.content);
                  updated[rel] = { path: rel, content: f.content };
                }

                return updated;
              } catch (error) {
                return "Error" + error;
              }
            });

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),

        // read files (utf8)
        createTool({
          name: "readFiles",
          description: "Read Files from the sandbox",
          parameters: z.object({ files: z.array(z.string()) }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sb = await getSandbox(sandboxId);
                const out: Array<{ path: string; content: string }> = [];
                for (const file of files) {
                  const content = await sb.files.read(file, "utf8");
                  out.push({ path: file, content });
                }
                return JSON.stringify(out);
              } catch (error) {
                return "Error" + error;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const last = LastAssistantTextMessageContent(result);
          if (last && last.includes("<task_summary>")) {
            network.state.data.summary = last;
          }
          return result;
        },
      },
    });

    // 4) network
    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => (network.state.data.summary ? undefined : codeAgent),
    });

    const result= await network.run(event.data.value);
    // const isError = 
    // !result.state.data.summary||Object.keys(result.state.data.files).length===0;


    // 5) ensure dev server running FROM THE RIGHT ROOT
    const ensureInfo = await step.run("ensure-dev-server", async () =>
      ensureDevServer(sandboxId, rootDir)
    );

    // 6) public URL
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

   


    await step.run("save-result", async () => {

      try {
        
        return await prisma.message.create({
          data: {
            content: result.state.data.summary || "", // summary text
            role: "ASSISTANT",
            type: "RESULT",
            fragment: {
              create: {
                sandboxUrl,
                title: "Fragment",
                files: result.state.data.files || {}, // JSON field
              },
            },
          },
          include: { fragment: true }, // optional: return nested fragment too
        });
      } catch (err) {
        console.error("DB Save Error:", err);
        throw err;
      }
    });
    
 

    // 7) final
    return {
      url: sandboxUrl,
      title: "fragment",
      summary: network.state.data.summary,
      files: network.state.data.files,
      ensure: ensureInfo,
      rootDir,
      appDir,
    };
  }
);
