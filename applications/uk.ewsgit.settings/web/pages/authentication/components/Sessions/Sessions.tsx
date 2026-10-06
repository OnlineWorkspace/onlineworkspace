import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, createSignal, For, Show, Suspense } from "solid-js";
import LOGOUT_ICON from "@material-symbols/svg-700/outlined/logout.svg";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import trpc from "../../../../lib/trpc";
import Session from "./components/Session/Session";
import styles from "./Sessions.module.scss";

const Sessions: Component = () => {
  const navigate = useNavigate();
  const [sessions, { refetch: refetchSessions }] = createResource(() => trpc.authentication.getSessions.query());
  const [confirming, setConfirming] = createSignal(false);
  const [error, setError] = createSignal<string>();

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
        <UKButton color="tonal" leadingIcon={LOGOUT_ICON} onClick={() => {
          setConfirming(true);
        }}>
          Log out everywhere
        </UKButton>
      </UKButtonGroup>
      <UKDialog show={confirming} onClose={() => {
          setConfirming(false);
        }} maxWidth="28rem">
        <div class={styles.dialog}>
          <UKText role="title" size="l">
            Log out everywhere?
          </UKText>
          <UKText role="body" size="m" align="start">
            Every device which is signed in to your account is signed out, including this one. You will need to sign in again.
          </UKText>
          <Show when={error()}>
            <UKText role="body" size="m" align="start" class={styles.error}>
              {error()}
            </UKText>
          </Show>
          <UKButtonGroup size="s">
            <UKButton color="tonal" onClick={() => {
              setConfirming(false);
            }}>
              Cancel
            </UKButton>
            <UKButton
              affirmative
              onClick={async () => {
                setError(undefined);

                try {
                  await trpc.authentication.logoutEverywhere.mutate({ keepCurrent: false });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "You could not be logged out");

                  return { state: AffirmativeButtonState.Error };
                }

                return {
                  state: AffirmativeButtonState.Success,
                  cb() {
                    navigate("/");
                  },
                };
              }}
            >
              Log out everywhere
            </UKButton>
          </UKButtonGroup>
        </div>
      </UKDialog>
    </>
  );
};

export default Sessions;
