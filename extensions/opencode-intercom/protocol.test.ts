import { expect, test } from "bun:test";
import { MAX_HOPS, wrapIntercomMessage } from "./protocol";

test("marker names the sender and the reply convention", () => {
  const wrapped = wrapIntercomMessage({
    text: "What does authMiddleware do?",
    origin: { sessionID: "ses_abc", title: "Porting models", hop: 1 },
  });
  expect(wrapped).toContain(
    '[intercom • from "Porting models" (ses_abc) • hop 1/3]',
  );
  expect(wrapped).toContain("What does authMiddleware do?");
  expect(wrapped).toContain("omit sessionID");
});

test("untitled senders fall back to untitled", () => {
  const wrapped = wrapIntercomMessage({
    text: "ping",
    origin: { sessionID: "ses_abc", hop: 1 },
  });
  expect(wrapped).toContain("[intercom • from untitled (ses_abc)");
});

test("hop budget matches MAX_HOPS", () => {
  expect(MAX_HOPS).toBe(3);
  const wrapped = wrapIntercomMessage({
    text: "ping",
    origin: { sessionID: "ses_abc", hop: MAX_HOPS },
  });
  expect(wrapped).toContain(`hop ${MAX_HOPS}/${MAX_HOPS}`);
});
