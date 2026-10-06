import CHECK_CIRCLE_ICON from "@material-symbols/svg-700/outlined/check_circle.svg";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import SYNC_ICON from "@material-symbols/svg-700/outlined/sync.svg";
import UPDATE_ICON from "@material-symbols/svg-700/outlined/update.svg";
import WARNING_ICON from "@material-symbols/svg-700/outlined/warning.svg";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, For, type ParentProps, Show } from "solid-js";
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

const ManageInstanceUpdatesPage: Component = () => {
  const navigate = useNavigate();
  const [status, { mutate }] = createResource(() => trpc.updates.status.query());

  const checked = () => status()?.checkedAt !== undefined;
  const behind = () => status()?.behind ?? 0;
  const ahead = () => status()?.ahead ?? 0;

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Updates"}
        subtitle={"The version this instance is running and whether there is a newer one."}
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
          <Show when={status()} fallback={<UKCircularProgressIndicator />}>
            {(current) => (
              <>
                <Show when={checked() && !current().checkError}>
                  <UKCard class={styles.notice} color="filled">
                    <UKIcon>{behind() > 0 ? UPDATE_ICON : CHECK_CIRCLE_ICON}</UKIcon>
                    <UKText role="body" size="m" align="start">
                      {behind() > 0
                        ? `${behind()} newer ${behind() === 1 ? "commit is" : "commits are"} available.`
                        : "This instance is up to date."}
                      {ahead() > 0 ? ` It also has ${ahead()} ${ahead() === 1 ? "commit" : "commits"} which are not on the remote.` : ""}
                    </UKText>
                  </UKCard>
                </Show>

                <Show when={current().checkError}>
                  <UKCard class={styles.notice} color="filled" data-kind="error">
                    <UKIcon>{WARNING_ICON}</UKIcon>
                    <UKText role="body" size="m" align="start">
                      Updates could not be checked: {current().checkError}
                    </UKText>
                  </UKCard>
                </Show>

                <Section title="This instance">
                  <UKCard class={styles.card} color="filled">
                    <div class={styles.facts}>
                      <UKText role="body" size="m" class={styles.hint}>
                        Version
                      </UKText>
                      <UKText role="body" size="m" align="start">
                        {current().version}
                      </UKText>
                      <Show when={current().isCheckout}>
                        <UKText role="body" size="m" class={styles.hint}>
                          Branch
                        </UKText>
                        <UKText role="body" size="m" align="start">
                          {current().branch ?? "unknown"}
                        </UKText>
                        <Show when={current().commit}>
                          {(commit) => (
                            <>
                              <UKText role="body" size="m" class={styles.hint}>
                                Commit
                              </UKText>
                              <UKText role="body" size="m" align="start">
                                {commit().hash} · {commit().subject} ({new Date(commit().date).toLocaleDateString()})
                              </UKText>
                            </>
                          )}
                        </Show>
                        <Show when={current().remote}>
                          <UKText role="body" size="m" class={styles.hint}>
                            Updates from
                          </UKText>
                          <UKText role="body" size="m" align="start">
                            {current().remote}
                          </UKText>
                        </Show>
                        <Show when={current().checkedAt}>
                          <UKText role="body" size="m" class={styles.hint}>
                            Last checked
                          </UKText>
                          <UKText role="body" size="m" align="start">
                            {new Date(current().checkedAt!).toLocaleString()}
                          </UKText>
                        </Show>
                      </Show>
                    </div>
                    <Show when={!current().isCheckout}>
                      <UKText role="body" size="s" class={styles.hint} align="start">
                        This instance is not running from a git checkout, so there is nothing to check for updates against.
                      </UKText>
                    </Show>
                    <Show when={current().hasLocalChanges}>
                      <UKText role="body" size="s" class={styles.hint} align="start">
                        The files on the server have changes which are not committed. Look after them before updating.
                      </UKText>
                    </Show>
                    <Show when={current().isCheckout}>
                      <div class={styles.actions}>
                        <UKButton
                          affirmative
                          leadingIcon={SYNC_ICON}
                          onClick={async () => {
                            try {
                              mutate(await trpc.updates.check.mutate());

                              return { state: AffirmativeButtonState.Success };
                            } catch {
                              return { state: AffirmativeButtonState.Error };
                            }
                          }}
                        >
                          Check for updates
                        </UKButton>
                      </div>
                    </Show>
                  </UKCard>
                </Section>

                <Show when={behind() > 0}>
                  <Section title="What's new" description={behind() > (current().incoming?.length ?? 0) ? `The newest ${current().incoming?.length} of ${behind()} changes.` : undefined}>
                    <UKCard class={styles.card} color="filled">
                      <div>
                        <For each={current().incoming}>
                          {(commit) => (
                            <div class={styles.commit}>
                              <UKText role="title" size="s" align="start">
                                {commit.subject}
                              </UKText>
                              <UKText role="body" size="s" class={styles.hint} align="start">
                                {commit.hash} · {commit.author} · {new Date(commit.date).toLocaleDateString()}
                              </UKText>
                            </div>
                          )}
                        </For>
                      </div>
                    </UKCard>
                  </Section>

                  <Section title="Steps to update" description="Updates are not applied from here. Do these on the server, in the instance's folder.">
                    <UKCard class={styles.card} color="filled">
                      <ol class={styles.steps}>
                        <li>
                          <UKText role="title" size="s" align="start">
                            Make a backup
                          </UKText>
                          <UKText role="body" size="s" class={styles.hint} align="start">
                            In Settings → Backups, so that you can go back if something goes wrong.
                          </UKText>
                        </li>
                        <Show when={current().hasLocalChanges}>
                          <li>
                            <UKText role="title" size="s" align="start">
                              Deal with the uncommitted changes
                            </UKText>
                            <UKText role="body" size="s" class={styles.hint} align="start">
                              Commit them, or put them aside, as the update cannot be applied over them.
                            </UKText>
                            <pre class={styles.code}>git stash</pre>
                          </li>
                        </Show>
                        <li>
                          <UKText role="title" size="s" align="start">
                            Get the new code
                          </UKText>
                          <pre class={styles.code}>{`git pull origin ${current().branch ?? ""}`.trim()}</pre>
                        </li>
                        <li>
                          <UKText role="title" size="s" align="start">
                            Install what it needs
                          </UKText>
                          <pre class={styles.code}>bun install</pre>
                        </li>
                        <li>
                          <UKText role="title" size="s" align="start">
                            Build the web interface
                          </UKText>
                          <UKText role="body" size="s" class={styles.hint} align="start">
                            Only needed when the instance is not running in development mode.
                          </UKText>
                          <pre class={styles.code}>bun run build-web</pre>
                        </li>
                        <li>
                          <UKText role="title" size="s" align="start">
                            Restart the instance
                          </UKText>
                          <UKText role="body" size="s" class={styles.hint} align="start">
                            Stop it and start it again, for example with <code>bun run start</code>. Everyone is signed out of their open pages until it is back.
                          </UKText>
                        </li>
                      </ol>
                    </UKCard>
                  </Section>
                </Show>
              </>
            )}
          </Show>
        </div>
      </div>
    </>
  );
};

export default ManageInstanceUpdatesPage;
