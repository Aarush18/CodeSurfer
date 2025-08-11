import { success } from "zod";
import { inngest } from "./client";
import { openai, createAgent } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("surf-nextjs-test-2");
      return sandbox.sandboxId;
    });
    const codeAgent = createAgent({
      name: "codeAgent",
      system:
        "You are an expert next.js eveloper . you writes redable , maintainable code. you create simple Next.js and react snippets",
      model: openai({ model: "gpt-4o" }),
    });
    const { output } = await codeAgent.run(
      `write the following snippet:${event.data.value}`
    );

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host =  sandbox.getHost(3000);
      return `https://${host}`;
    });
    // await step.sleep("wait-a-moment", "5s");

    return { output , sandboxUrl };
  }
);
