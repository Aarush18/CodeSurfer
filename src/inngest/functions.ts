import { success } from "zod";
import { inngest } from "./client";
import { openai, createAgent } from "@inngest/agent-kit";

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event }) => {
        const codeAgent = createAgent({
            name: "codeAgent",
            system: "You are an expert next.js eveloper . you writes redable , maintainable code. you create simple Next.js and react snippets",
            model: openai({ model: "gpt-4o" }),
          });
          const { output } =await codeAgent.run(
            `write the following snippet:${event.data.value}`,
          );
          
    

        // await step.sleep("wait-a-moment", "5s");

        return { output };
    },
);