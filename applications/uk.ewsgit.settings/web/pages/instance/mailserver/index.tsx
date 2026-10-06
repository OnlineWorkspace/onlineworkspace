import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, createResource, createSignal, type ParentProps, Show } from "solid-js";
import baseSettingsPageStyles from "../../../BaseSettingsPage.module.scss";
import trpc from "../../../lib/trpc.ts";
import styles from "./index.module.scss";

const Section: Component<ParentProps<{ title: string; description?: string }>> = (props) => (
  <section class={styles.section}>
    <div class={styles.sectionHeading}>
      <UKText role="title" size="m" emphasized>
        {props.title}
      </UKText>
      <Show when={props.description}>
        <UKText role="body" size="s" class={styles.hint}>
          {props.description}
        </UKText>
      </Show>
    </div>
    {props.children}
  </section>
);

const ManageInstanceMailServerPage: Component = () => {
  const navigate = useNavigate();
  const [saved, { mutate }] = createResource(() => trpc.instance.mailserver.get.query());

  const [enabled, setEnabled] = createSignal(false);
  const [host, setHost] = createSignal("");
  const [port, setPort] = createSignal("");
  const [secure, setSecure] = createSignal(true);
  const [user, setUser] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [message, setMessage] = createSignal<{ kind: "error" | "success"; text: string }>();

  // the fields start from what is saved
  createEffect(() => {
    const config = saved();

    if (!config) return;

    setEnabled(config.enabled);
    setHost(config.host);
    setPort(config.port.toString());
    setSecure(config.secure);
    setUser(config.user);
  });

  const save = async () => {
    setMessage(undefined);

    const portNumber = Number(port());

    if (!Number.isInteger(portNumber)) {
      setMessage({ kind: "error", text: "The port must be a number" });

      return AffirmativeButtonState.Error;
    }

    try {
      const result = await trpc.instance.mailserver.set.mutate({
        enabled: enabled(),
        host: host(),
        port: portNumber,
        secure: secure(),
        user: user(),
        password: password() || undefined,
      });

      mutate(await trpc.instance.mailserver.get.query());
      setPassword("");

      if (result.error) {
        // saved, but the server could not be reached with these settings
        setMessage({ kind: "error", text: `Saved, but the connection failed: ${result.error}` });

        return AffirmativeButtonState.Error;
      }

      setMessage({ kind: "success", text: enabled() ? "Saved. The mail server is connected." : "Saved." });

      return AffirmativeButtonState.Success;
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "The settings could not be saved" });

      return AffirmativeButtonState.Error;
    }
  };

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Manage Instance Mail Server"}
        subtitle={"Caution: Advanced users only, change at your own risk."}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={baseSettingsPageStyles.baseSettingsPageContent}>
        <div class={styles.page}>
          <Section title="Status">
            <UKCard class={styles.card} color="filled">
              <div class={styles.row}>
                <div class={styles.heading}>
                  <UKText role="title" size="m">
                    Send emails from this instance
                  </UKText>
                  <UKText role="body" size="s" class={styles.hint}>
                    Used for account notices and instance status emails. When this is off, no emails are sent.
                  </UKText>
                </div>
                <UKSwitch value={enabled()} onValueChange={setEnabled} />
              </div>
            </UKCard>
          </Section>
          <Section title="Server" description="The SMTP server emails are sent through.">
            <UKCard class={styles.card} color="filled">
              <div class={styles.hostContainer}>
                <UKTextField color="outlined" label="Host" value={host()} onValueChange={setHost} />
                <UKTextField color="outlined" label="Port" value={port()} onValueChange={setPort} />
              </div>
              <div class={styles.row}>
                <div class={styles.heading}>
                  <UKText role="title" size="s">
                    Use TLS from the start
                  </UKText>
                  <UKText role="body" size="s" class={styles.hint}>
                    On for port 465. Off for port 587, which starts as plain text and upgrades itself.
                  </UKText>
                </div>
                <UKSwitch value={secure()} onValueChange={setSecure} />
              </div>
            </UKCard>
          </Section>
          <Section title="Sign in" description="The account used to send emails. Its username is also the address emails are sent from.">
            <UKCard class={styles.card} color="filled">
              <UKTextField color="outlined" label="Username" value={user()} onValueChange={setUser} />
              <UKTextField
                color="outlined"
                label={saved()?.hasPassword ? "Password (leave blank to keep the current one)" : "Password"}
                value={password()}
                onValueChange={setPassword}
                shouldMask={true}
              />
            </UKCard>
          </Section>
          <div class={styles.actions}>
            <Show when={message()}>
              {(current) => (
                <UKText role="body" size="m" class={styles.message} data-kind={current().kind}>
                  {current().text}
                </UKText>
              )}
            </Show>
            <UKButton
              color="tonal"
              disabled={!saved()?.enabled}
              onClick={async () => {
                setMessage(undefined);

                const result = await trpc.instance.mailserver.sendTest.mutate();

                setMessage(
                  result.error
                    ? { kind: "error", text: `The test email failed: ${result.error}` }
                    : { kind: "success", text: "A test email was sent to your address." },
                );
              }}
            >
              Send test email
            </UKButton>
            <UKButton
              affirmative
              onClick={async () => {
                return { state: await save() };
              }}
            >
              Save
            </UKButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageInstanceMailServerPage;
