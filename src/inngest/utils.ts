import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

export async function getSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  return sandbox;
}

// Detect the real project root inside the sandbox (prefers nextjs-app)
export async function detectRootDir(sandboxId: string): Promise<string> {
  const sb = await getSandbox(sandboxId);
  const { stdout } = await sb.commands.run(`bash -lc '
    for d in /home/user/nextjs-app /home/user /workspace /project /app /; do
      if [ -f "$d/package.json" ]; then echo "$d"; exit 0; fi
    done
    echo "/home/user/nextjs-app"
  '`);
  return (stdout || "/home/user/nextjs-app").trim();
}

// Decide whether project uses "app" or "src/app"
export async function detectAppDir(
  sandboxId: string,
  root: string
): Promise<"app" | "src/app"> {
  const sb = await getSandbox(sandboxId);
  const { stdout } = await sb.commands.run(
    `bash -lc 'test -d "${root}/src/app" && echo src/app || echo app'`
  );
  const dir = (stdout || "app").trim();
  return dir === "src/app" ? "src/app" : "app";
}

// Keep Next dev server alive; return debug info
export async function ensureDevServer(sandboxId: string, root: string) {
  const sb = await getSandbox(sandboxId);

  const check = async () => {
    const a = await sb.commands.run(
      `bash -lc '(ss -lnt 2>/dev/null || netstat -lnt 2>/dev/null) | grep -q ":3000" && echo open || echo closed'`
    );
    return a.stdout.trim();
  };

  const before = await check();
  let started = false;
  let pid = "";

  if (before !== "open") {
    await sb.commands.run(
      `bash -lc 'cd "${root}" && if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then npm ci --silent || npm install --silent; else npm install --silent; fi'`
    );
    const r = await sb.commands.run(
      `bash -lc 'cd "${root}" && nohup npm run dev -- -p 3000 >/tmp/next.log 2>&1 & echo $!'`
    );
    pid = r.stdout.trim();
    started = !!pid;
    await sb.commands.run(`sleep 1`);
  }

  const after = await check();
  const logTail = (
    await sb.commands.run(`bash -lc 'tail -n 120 /tmp/next.log 2>/dev/null || true'`)
  ).stdout;

  return { rootDir: root, portBefore: before, portAfter: after, started, pid, logTail };
}

export function LastAssistantTextMessageContent(result: AgentResult) {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant"
  );
  const message = result.output[lastAssistantTextMessageIndex] as | TextMessage | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
}
