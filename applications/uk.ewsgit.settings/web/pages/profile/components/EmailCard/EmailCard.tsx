import MAIL_ICON from "@material-symbols/svg-700/outlined/mail.svg";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createResource, createSignal, Show } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./EmailCard.module.scss";

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

/** an email address is only saved once the user enters a code that was sent to it, proving they own it */
const EmailCard: Component = () => {
  const [status, { refetch }] = createResource(() => trpc.profile.getEmailStatus.query());
  const [email, setEmail] = createSignal("");
  const [code, setCode] = createSignal("");
  // the address a code has been sent to, while the user is entering it
  const [pendingEmail, setPendingEmail] = createSignal<string>();
  const [error, setError] = createSignal<string>();

  const disabled = () => status()?.sendingEnabled === false;
  const reset = () => {
    setEmail("");
    setCode("");
    setPendingEmail(undefined);
    setError(undefined);
  };

  return (
    <UKCard class={styles.root}>
      <div class={styles.header}>
        <UKText role="title" size="m" emphasized align="start" class={styles.title}>
          Email
        </UKText>
        <UKText role="body" size="s" align="start" class={styles.description}>
          Used for login codes and notifications from your workspace.
        </UKText>
      </div>
      <Show when={status()?.email}>
        <div class={styles.current}>
          <UKText role="body" size="l" align="start" class={styles.address}>
            {status()?.email}
          </UKText>
          <UKText role="label" size="m" class={styles.badge}>
            {status()?.verified ? "Verified" : "Not verified"}
          </UKText>
          <UKButton
            color="standard"
            onClick={async () => {
              await trpc.profile.removeEmail.mutate();
              reset();
              refetch();
            }}
          >
            Remove
          </UKButton>
        </div>
      </Show>
      <Show
        when={!disabled()}
        fallback={
          <UKText role="body" size="m" align="start" class={styles.hint}>
            This instance has email sending disabled, so an email address can't be added. Ask an administrator to set up a mail server.
          </UKText>
        }
      >
        <Show
          when={pendingEmail()}
          fallback={
            <>
              <UKTextField label={status()?.email ? "New email address" : "Email address"} color="outlined" value={email()} onValueChange={setEmail} leadingIcon={{ icon: MAIL_ICON }} />
              <div class={styles.actions}>
                <UKButton
                  affirmative
                  onClick={async () => {
                    setError(undefined);

                    try {
                      await trpc.profile.startEmailVerification.mutate(email().trim());
                      setPendingEmail(email().trim());

                      return { state: AffirmativeButtonState.Success };
                    } catch (err) {
                      setError(messageOf(err, "Enter a valid email address"));

                      return { state: AffirmativeButtonState.Error };
                    }
                  }}
                >
                  Send code
                </UKButton>
              </div>
            </>
          }
        >
          <UKText role="body" size="m" align="start" class={styles.hint}>
            We sent a code to {pendingEmail()}. Enter it to confirm the address is yours.
          </UKText>
          <UKTextField label="Verification code" color="outlined" value={code()} onValueChange={setCode} />
          <div class={styles.actions}>
            <UKButton color="standard" onClick={reset}>
              Cancel
            </UKButton>
            <UKButton
              affirmative
              onClick={async () => {
                setError(undefined);

                try {
                  await trpc.profile.confirmEmail.mutate({ email: pendingEmail()!, code: code() });
                  reset();
                  refetch();

                  return { state: AffirmativeButtonState.Success };
                } catch (err) {
                  setError(messageOf(err, "That code isn't right"));

                  return { state: AffirmativeButtonState.Error };
                }
              }}
            >
              Verify
            </UKButton>
          </div>
        </Show>
      </Show>
      <Show when={error()}>
        <UKText role="body" size="s" align="start" class={styles.error}>
          {error()}
        </UKText>
      </Show>
    </UKCard>
  );
};

export default EmailCard;
