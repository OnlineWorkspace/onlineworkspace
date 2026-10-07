import { type Accessor, createContext, createResource, createSignal, onCleanup, type ParentProps, useContext } from "solid-js";
import { errorMessage } from "./format";
import trpc from "./trpc";
import type { ProcessDto } from "./types";

interface ProcessesContext {
  processes: Accessor<ProcessDto[] | undefined>;
  loading: Accessor<boolean>;
  error: Accessor<unknown>;
  refresh: () => void;
  /** runs an action, reports its outcome in a snackbar and refreshes the list */
  perform: <T>(action: () => Promise<T>, success?: string) => Promise<T | undefined>;
  /** the same for a button, which has nothing to do with the result */
  act: (action: () => Promise<unknown>, success?: string) => Promise<void>;
  message: Accessor<string | undefined>;
  dismissMessage: () => void;
  notify: (message: string) => void;
}

const Context = createContext<ProcessesContext>();

const POLL_MS = 2000;
const MESSAGE_MS = 5000;

export default function ProcessesProvider(props: ParentProps) {
  const [processes, { refetch }] = createResource(() => trpc.list.query());
  const [message, setMessage] = createSignal<string>();
  let messageTimer: ReturnType<typeof setTimeout> | undefined;

  // the state of the processes changes without anyone asking, so the list is kept current while the page is visible
  const poll = setInterval(() => {
    if (!document.hidden) refetch();
  }, POLL_MS);

  onCleanup(() => {
    clearInterval(poll);
    clearTimeout(messageTimer);
  });

  const notify = (text: string) => {
    clearTimeout(messageTimer);
    setMessage(text);
    messageTimer = setTimeout(() => setMessage(undefined), MESSAGE_MS);
  };

  const value: ProcessesContext = {
    processes: () => processes.latest,
    loading: () => processes.loading && processes.latest === undefined,
    error: () => processes.error,
    refresh: () => void refetch(),
    notify,
    message,
    dismissMessage: () => setMessage(undefined),
    async act(action, success) {
      await value.perform(action, success);
    },
    async perform(action, success) {
      try {
        const result = await action();

        if (success) notify(success);

        return result;
      } catch (error) {
        notify(errorMessage(error));

        return undefined;
      } finally {
        await refetch();
      }
    },
  };

  return <Context.Provider value={value}>{props.children}</Context.Provider>;
}

export function useProcesses(): ProcessesContext {
  const context = useContext(Context);

  if (!context) throw new Error("useProcesses must be used inside ProcessesProvider");

  return context;
}
