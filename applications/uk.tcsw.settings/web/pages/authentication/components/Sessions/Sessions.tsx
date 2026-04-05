import { createResource, For, Suspense, type Component } from "solid-js";
import trpc from "../../../../lib/trpc";
import Session from "./components/Session/Session";
import UKButtonGroup from "@tcsw/uikit-solid/src/components/buttonGroup/UKButtonGroup.jsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import styles from "./Sessions.module.scss";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";

const Sessions: Component = () => {
  const [sessions, { refetch: refetchSessions }] = createResource(() => trpc.authentication.getSessions.query());

  return (
    <>
      <UKStack>
        <Suspense fallback={<UKIndeterminateSpinner class={styles.spinner} />}>
          <For each={sessions()}>
            {(s) => {
              return <Session {...s} refetch={refetchSessions} />;
            }}
          </For>
        </Suspense>
      </UKStack>
      <UKButtonGroup size="s" class={styles.buttonGroup}>
        <UKButton
          affirmative
          color="tonal"
          onClick={async () => {
            const sessionsArray = sessions();
            if (!sessionsArray || sessionsArray.length === 0) return;

            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const sessionsToDelete = sessionsArray
              .filter((session) => session.firstLoginTimestamp < weekAgo && !session.isCurrent)
              .map((session) => session.sessionId);

            if (sessionsToDelete.length === 0) return;

            await Promise.all(sessionsToDelete.map((sessionId) => trpc.authentication.deleteSession.mutate({ sessionId })));

            refetchSessions();
          }}
        >
          Remove sessions older than a week
        </UKButton>
      </UKButtonGroup>
    </>
  );
};

export default Sessions;
