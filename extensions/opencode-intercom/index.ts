import { Plugin } from "@opencode/plugin";
import { MAX_HOPS, wrapIntercomMessage } from "./protocol";
import { Intercom } from "./rpc";

interface ReplyTarget {
  from: string;
  hop: number;
}

export default Plugin.define({
  id: "intercom",
  async setup(ctx) {
    const replyKey = (sessionID: string) => `reply/${sessionID}`;

    const deliver = async (input: {
      from: string;
      to: string;
      text: string;
      hop: number;
    }) => {
      const hop = input.hop + 1;
      let fromTitle = "";
      try {
        const sender = await ctx.session.get({ sessionID: input.from });
        fromTitle = sender?.title ?? "";
      } catch {
        // Sender may already be deleted; deliver without a title.
      }
      const delivered = await ctx.session.prompt({
        sessionID: input.to,
        text: wrapIntercomMessage({
          text: input.text,
          origin: { sessionID: input.from, title: fromTitle, hop },
        }),
        delivery: "queue",
        metadata: { intercom: { from: input.from, hop } },
      });
      await ctx.storage.set(replyKey(input.to), {
        from: input.from,
        hop,
      } satisfies ReplyTarget);
      await registration.events.emit("message", {
        from: input.from,
        to: input.to,
        fromTitle,
        text: input.text,
        hop,
      });
      const delivery = (delivered as { delivery?: string } | undefined)
        ?.delivery;
      return {
        delivery:
          delivery === "steer" ? ("steer" as const) : ("queue" as const),
      };
    };

    const registration = await ctx.rpc.register(Intercom, {
      send: async (rawInput, context) => {
        // register() types handler input as unknown; narrow to the shared contract.
        const input = rawInput as {
          from: string;
          to: string;
          text: string;
          hop?: number;
        };
        if (input.hop !== undefined && input.hop >= MAX_HOPS) {
          return context.error(
            "hop_limit",
            `Intercom hop limit of ${MAX_HOPS} reached`,
            { hop: input.hop },
          );
        }
        return deliver({
          from: input.from,
          to: input.to,
          text: input.text,
          hop: input.hop ?? 0,
        });
      },
    });

    await ctx.tool.transform((editor) => {
      editor.namespace({
        name: "intercom",
        description: "Message other OpenCode sessions",
      });
      editor.add({
        name: "send",
        description:
          "Send a message to another OpenCode session (tool name: intercom_send). The message is queued into that session and its agent handles it on delivery. " +
          "When a message marked [intercom] arrives in this session, reply with intercom_send and omit sessionID to reach the sender. " +
          "Agent-to-agent chains are capped at " +
          MAX_HOPS +
          " hops.",
        input: {
          type: "object",
          properties: {
            sessionID: {
              type: "string",
              description:
                "Target session ID. Omit when replying to an [intercom] message to reach its sender.",
            },
            text: {
              type: "string",
              description: "Message for the receiving session's agent.",
            },
          },
          required: ["text"],
          additionalProperties: false,
        },
        options: { namespace: "intercom", codemode: true },
        execute: async (input, tool) => {
          const { text, sessionID } = input as {
            text: string;
            sessionID?: string;
          };
          const self = (tool as { sessionID?: string }).sessionID;
          if (!self) {
            return {
              content:
                "intercom needs the current session ID, which is unavailable here.",
            };
          }
          let to = sessionID;
          let hop = 0;
          if (!to) {
            // storage returns Json; the value here is always our own ReplyTarget.
            const reply = (await ctx.storage.get(replyKey(self))) as
              ReplyTarget | undefined;
            if (!reply || typeof reply.from !== "string") {
              return {
                content:
                  "No session has messaged you yet; pass an explicit sessionID.",
              };
            }
            to = reply.from;
            hop = Number(reply.hop ?? 0);
          }
          if (hop >= MAX_HOPS) {
            return {
              content: `Intercom hop limit of ${MAX_HOPS} reached; message not delivered.`,
            };
          }
          const result = await deliver({ from: self, to, text, hop });
          return { content: `Delivered to ${to} (${result.delivery}).` };
        },
      });
    });
  },
});
