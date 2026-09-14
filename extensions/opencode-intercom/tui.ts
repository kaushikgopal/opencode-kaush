import { Plugin } from "@opencode/plugin/tui";
import { Intercom } from "./rpc";

const MAX_PICKER = 15;

type AnyRecord = Record<string, any>;
type IntercomClient = ReturnType<AnyRecord["rpc"]>;

export default Plugin.define({
  id: "intercom.tui",
  setup(context) {
    const intercom = context.client.rpc(Intercom);

    const unsubscribe = intercom.events.on("message", (event: any) => {
      const data = event.data as {
        from: string;
        to: string;
        fromTitle: string;
        text: string;
      };
      if (!hasOpenSession(context, data.to)) return;
      context.ui.toast.show({
        title: "Intercom",
        message: `${data.fromTitle || "A session"}: ${data.text.slice(0, 120)}`,
        variant: "info",
      });
    });

    // Keymap services exist inside the app's render tree, so register the
    // /intercom command from an "app" slot rather than directly in setup.
    const removeSlot = context.ui.slot({
      append: "app",
      render: () => {
        context.keymap.layer(() => ({
          mode: "global",
          commands: [
            {
              id: "intercom.send",
              title: "Intercom: send a message to another session",
              group: "Intercom",
              palette: true,
              slash: { name: "intercom" },
              run: () => {
                void runIntercom(context, intercom);
              },
            },
          ],
        }));
        return null;
      },
    });

    return () => {
      unsubscribe();
      if (typeof removeSlot === "function") removeSlot();
    };
  },
});

async function runIntercom(context: any, intercom: IntercomClient) {
  const from = currentSessionID(context);
  if (!from) {
    context.ui.toast.show({
      message:
        "Open a session first — /intercom sends from the current session.",
      variant: "warning",
    });
    return;
  }
  const [sessions, projects] = await Promise.all([
    listSessions(context),
    listProjects(context),
  ]);
  const options = sessions
    .filter(
      (session: AnyRecord) =>
        session.id !== from && !session.parentID && !session.time?.archived,
    )
    .sort(
      (a: AnyRecord, b: AnyRecord) =>
        (b.time?.updated ?? 0) - (a.time?.updated ?? 0),
    )
    .slice(0, MAX_PICKER)
    .map((session: AnyRecord) => ({
      title:
        (typeof session.title === "string" && session.title.trim()) ||
        "Untitled",
      value: session.id as string,
      description: describeSession(session, projects),
    }));
  if (options.length === 0) {
    context.ui.toast.show({
      message: "No other sessions found.",
      variant: "info",
    });
    return;
  }

  const picked = unwrapSelection(
    await context.ui.dialog.select({
      title: "Intercom — send to session",
      current: options[0].value,
      options,
    }),
  );
  if (!picked) return;
  const pickedTitle =
    options.find((option: { value: string }) => option.value === picked)
      ?.title ?? picked;

  const text = await context.ui.dialog.prompt({
    title: `Message → ${pickedTitle}`,
    placeholder: "What should that session's agent do?",
  });
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) return;

  await intercom.send({ from, to: picked, text: trimmed, hop: 0 });
  context.ui.toast.show({
    title: "Intercom",
    message: `Sent to ${pickedTitle}.`,
    variant: "success",
  });
}

function currentSessionID(context: any): string | null {
  try {
    const route = context.ui.router.current() as AnyRecord | undefined;
    return (
      route?.sessionID ??
      route?.data?.sessionID ??
      route?.params?.sessionID ??
      null
    );
  } catch {
    return null;
  }
}

function hasOpenSession(context: any, sessionID: string): boolean {
  try {
    const tabs = context.ui.tabs.list?.() ?? [];
    // Tab entry shape is not documented; match the session ID anywhere in it.
    return JSON.stringify(tabs).includes(sessionID);
  } catch {
    return true;
  }
}

async function unwrap(promise: Promise<any>) {
  const response = await promise;
  return response?.data ?? response;
}

async function listSessions(context: any): Promise<AnyRecord[]> {
  try {
    const data = await unwrap(context.client.session.list());
    return Array.isArray(data) ? data : [];
  } catch {
    try {
      return context.data.session.list() ?? [];
    } catch {
      return [];
    }
  }
}

async function listProjects(context: any): Promise<Map<string, string>> {
  try {
    const data = await unwrap(context.client.project.list());
    const projects = Array.isArray(data) ? data : [];
    return new Map(
      projects.map((project: AnyRecord) => [
        project.id as string,
        String(project.directory ?? project.path ?? project.id),
      ]),
    );
  } catch {
    return new Map();
  }
}

function unwrapSelection(selection: any): string | null {
  if (typeof selection === "string") return selection;
  if (
    selection &&
    typeof selection === "object" &&
    typeof selection.value === "string"
  )
    return selection.value;
  return null;
}

function describeSession(
  session: AnyRecord,
  projects: Map<string, string>,
): string {
  const bits: string[] = [];
  const project = projects.get(session.projectID as string);
  if (project) bits.push(project.split("/").filter(Boolean).pop() ?? project);
  if (typeof session.agent === "string" && session.agent)
    bits.push(`@${session.agent}`);
  const updated = session.time?.updated;
  if (typeof updated === "number")
    bits.push(`${age(normalizeMs(updated))} ago`);
  return bits.join(" · ");
}

function normalizeMs(value: number): number {
  return value < 1e12 ? value * 1000 : value;
}

function age(ms: number): string {
  const seconds = Math.max(1, Math.round((Date.now() - ms) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}
