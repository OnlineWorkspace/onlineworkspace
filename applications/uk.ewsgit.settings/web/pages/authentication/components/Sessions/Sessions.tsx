import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import { type Component, createResource, For, Suspense } from "solid-js";
import trpc from "../../../../lib/trpc";
import Session from "./components/Session/Session";
import styles from "./Sessions.module.scss";

const Sessions: Component = () => {
  const [sessions, { refetch: refetchSessions }] = createResource(() => trpc.authentication.getSessions.query());

  return (
    <>
      <UKStack>
        <Suspense fallback={<UKCircularProgressIndicator class={styles.spinner} />}>
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
          disabled={sessions()?.length === 0}
          color="tonal"
          onClick={async () => {
            const sessionsArray = sessions()!;

            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const sessionsToDelete = sessionsArray
              .filter((session) => session.firstLoginTimestamp < weekAgo && !session.isCurrent)
              .map((session) => session.sessionId);

            if (sessionsToDelete.length === 0)
              return {
                state: AffirmativeButtonState.Success,
              };

            await Promise.all(sessionsToDelete.map((sessionId) => trpc.authentication.deleteSession.mutate({ sessionId })));

            return {
              state: AffirmativeButtonState.Success,
              cb: () => {
                refetchSessions();
              },
            };
          }}
        >
          Remove sessions older than a week
        </UKButton>
      </UKButtonGroup>
    </>
  );
};

export default Sessions;
