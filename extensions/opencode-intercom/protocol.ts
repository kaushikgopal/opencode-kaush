export const MAX_HOPS = 3;

export interface IntercomOrigin {
  sessionID: string;
  title?: string;
  hop: number;
}

/**
 * Wraps a message so the receiving agent knows it arrived over the intercom,
 * who sent it, and how to answer. The marker doubles as the hop guard: the
 * reply tool reads the hop back out of storage to stop runaway agent-to-agent
 * loops.
 */
export function wrapIntercomMessage({
  text,
  origin,
}: {
  text: string;
  origin: IntercomOrigin;
}): string {
  const title = origin.title?.trim() ? `"${origin.title.trim()}"` : "untitled";
  return [
    `[intercom • from ${title} (${origin.sessionID}) • hop ${origin.hop}/${MAX_HOPS}]`,
    text.trim(),
    "(Reply with the intercom tool; omit sessionID to answer this sender.)",
  ].join("\n\n");
}
