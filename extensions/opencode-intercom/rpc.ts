import { Rpc } from "@opencode/plugin/rpc";

/**
 * Shared RPC contract. The server plugin implements `send`; TUI plugins call it
 * for user-initiated sends and subscribe to `message` for incoming toasts.
 */
export const Intercom = Rpc.define({
  id: "intercom",
  methods: {
    send: {
      input: {
        type: "object",
        properties: {
          from: { type: "string", description: "Sending session ID" },
          to: { type: "string", description: "Target session ID" },
          text: { type: "string" },
          hop: {
            type: "number",
            description:
              "Intercom hops already used; 0 for user-initiated sends",
          },
        },
        required: ["from", "to", "text"],
        additionalProperties: false,
      },
      output: {
        type: "object",
        properties: {
          delivery: { type: "string", enum: ["steer", "queue"] },
        },
        required: ["delivery"],
        additionalProperties: false,
      },
      errors: {
        hop_limit: {
          type: "object",
          properties: { hop: { type: "number" } },
          required: ["hop"],
          additionalProperties: false,
        },
      },
    },
  },
  events: {
    message: {
      schema: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          fromTitle: { type: "string" },
          text: { type: "string" },
          hop: { type: "number" },
        },
        required: ["from", "to", "fromTitle", "text", "hop"],
        additionalProperties: false,
      },
    },
  },
});
