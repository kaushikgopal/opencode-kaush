import { expect, test } from "bun:test";
import { wrapIntercomMessage } from "./protocol";

test("one-line provenance, message preserved verbatim", () => {
  const wrapped = wrapIntercomMessage({
    text: "What does authMiddleware do?",
    title: "Porting models",
  });
  expect(wrapped).toBe(
    '[intercom · from "Porting models"]\n\nWhat does authMiddleware do?',
  );
});

test("untitled senders degrade gracefully", () => {
  const wrapped = wrapIntercomMessage({ text: "ping" });
  expect(wrapped).toBe("[intercom · from another session]\n\nping");
});
