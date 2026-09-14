export const MAX_HOPS = 3;

/**
 * Wraps a message for delivery. The one-line provenance is the only ceremony:
 * it tells the receiving agent (and human) which session sent it. Reply
 * mechanics live in the tool description, never in the message. The hop
 * budget is enforced from delivery metadata, not displayed.
 */
export function wrapIntercomMessage({
  text,
  title,
}: {
  text: string;
  title?: string;
}): string {
  const sender = title?.trim() ? `"${title.trim()}"` : "another session";
  return `[intercom · from ${sender}]\n\n${text.trim()}`;
}
