import BACKUP_ICON from "@material-symbols/svg-700/outlined/backup.svg";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DOWNLOAD_ICON from "@material-symbols/svg-700/outlined/download.svg";
import RESTORE_ICON from "@material-symbols/svg-700/outlined/history.svg";
import WARNING_ICON from "@material-symbols/svg-700/outlined/warning.svg";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKSegmentedButton from "@ewsgit/uikit-solid/src/components/segmentedButton/UKSegmentedButton.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, createResource, createSignal, For, onCleanup, type ParentProps, Show } from "solid-js";
import baseSettingsPageStyles from "../../../BaseSettingsPage.module.scss";
import trpc from "../../../lib/trpc.ts";
import { formatSize } from "../../storage/formatSize.ts";
import styles from "./index.module.scss";

type Overview = Awaited<ReturnType<typeof trpc.backups.overview.query>>;
type Backup = Overview["backups"][number];

const TRIGGER_LABELS: Record<Backup["trigger"], string> = {
  manual: "Manual",
  scheduled: "Scheduled",
  "pre-restore": "Made before a restore",
};

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

const errorText = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

const ManageInstanceBackupsPage: Component = () => {
  const navigate = useNavigate();
  const [overview, { refetch }] = createResource(() => trpc.backups.overview.query());

  const [scope, setScope] = createSignal<"full" | "database">("full");
  const [mode, setMode] = createSignal<"full" | "incremental">("full");
  const [note, setNote] = createSignal("");
  const [message, setMessage] = createSignal<{ kind: "error" | "success"; text: string }>();

  const [scheduleEnabled, setScheduleEnabled] = createSignal(false);
  const [intervalHours, setIntervalHours] = createSignal("24");
  const [keep, setKeep] = createSignal("7");
  const [includeFiles, setIncludeFiles] = createSignal(true);
  const [incremental, setIncremental] = createSignal(true);
  const [fullEvery, setFullEvery] = createSignal("7");
  const [scheduleMessage, setScheduleMessage] = createSignal<{ kind: "error" | "success"; text: string }>();

  const [restoring, setRestoring] = createSignal<Backup>();
  const [restorePassword, setRestorePassword] = createSignal("");
  const [restoreError, setRestoreError] = createSignal<string>();
  const [restored, setRestored] = createSignal(false);
  const [deleting, setDeleting] = createSignal<Backup>();
  const [deleteError, setDeleteError] = createSignal<string>();

  // the schedule fields start from what is saved
  createEffect(() => {
    const schedule = overview()?.schedule;

    if (!schedule) return;

    setScheduleEnabled(schedule.enabled);
    setIntervalHours(String(schedule.intervalHours));
    setKeep(String(schedule.keep));
    setIncludeFiles(schedule.includeFiles);
    setIncremental(schedule.incremental);
    setFullEvery(String(schedule.fullEvery));
  });

  // a backup or restore which is running is followed, a backup can take a while
  createEffect(() => {
    if (!overview()?.job) return;

    const timer = setInterval(() => void refetch(), 1500);

    onCleanup(() => clearInterval(timer));
  });

  const startPolling = () => {
    const timer = setInterval(() => void refetch(), 1500);

    return () => clearInterval(timer);
  };

  const tools = () => overview()?.tools;
  const toolsMissing = () => !!tools() && !(tools()!.pgDump && tools()!.pgRestore && tools()!.tar);

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Backups"}
        subtitle={"Copies of the database and everyone's files, for if something goes wrong."}
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
          <Show when={toolsMissing()}>
            <UKCard class={styles.notice} color="filled">
              <UKIcon>{WARNING_ICON}</UKIcon>
              <UKText role="body" size="m" align="start">
                Backups need <code>pg_dump</code>, <code>pg_restore</code> and <code>tar</code> to be installed on the server. Missing:{" "}
                {[!tools()?.pgDump && "pg_dump", !tools()?.pgRestore && "pg_restore", !tools()?.tar && "tar"].filter(Boolean).join(", ")}.
              </UKText>
            </UKCard>
          </Show>

          <Show when={overview()?.job}>
            {(job) => (
              <UKCard class={styles.notice} color="filled">
                <UKCircularProgressIndicator />
                <UKText role="body" size="m" align="start">
                  {job().kind === "restore" ? "Restoring a backup" : "Making a backup"}: {job().stage}...
                </UKText>
              </UKCard>
            )}
          </Show>

          <Show when={overview()?.failure}>
            {(failure) => (
              <UKCard class={styles.notice} color="filled" data-kind="error">
                <UKIcon>{WARNING_ICON}</UKIcon>
                <UKText role="body" size="m" align="start">
                  The last {failure().kind} failed: {failure().message}
                </UKText>
              </UKCard>
            )}
          </Show>

          <Section title="Make a backup" description="The instance carries on running while it is made. Backups are kept on this server, in the backups folder, and contain everything which is in the database including configuration secrets.">
            <UKCard class={styles.card} color="filled">
              <UKSegmentedButton
                items={[
                  { id: "full", label: "Everything" },
                  { id: "database", label: "Database only" },
                ]}
                selectedId={scope}
                onSelect={(id) => setScope(id as "full" | "database")}
              />
              <UKText role="body" size="s" class={styles.hint} align="start">
                {scope() === "full" ? "The database, the configuration and every user's files." : "The database and the configuration, without anyone's files. Much smaller and quicker."}
              </UKText>
              <Show when={scope() === "full"}>
                <UKSegmentedButton
                  items={[
                    { id: "full", label: "All files" },
                    { id: "incremental", label: "Only what changed" },
                  ]}
                  selectedId={mode}
                  onSelect={(id) => setMode(id as "full" | "incremental")}
                />
                <UKText role="body" size="s" class={styles.hint} align="start">
                  {mode() === "full"
                    ? "Every file is copied, so this backup can be restored on its own."
                    : "Only the files which changed since your last backup are copied, which is much smaller and quicker. Restoring it also needs the backups it continues from, which cannot be deleted while it exists. The database is always copied whole. If there is no earlier backup to continue from, everything is copied."}
                </UKText>
              </Show>
              <UKTextField color="outlined" label="Note (optional)" value={note()} onValueChange={setNote} />
              <Show when={message()}>
                {(current) => (
                  <UKText role="body" size="m" class={styles.message} data-kind={current().kind} align="start">
                    {current().text}
                  </UKText>
                )}
              </Show>
              <div class={styles.actions}>
                <UKButton
                  affirmative
                  leadingIcon={BACKUP_ICON}
                  disabled={toolsMissing() || !!overview()?.job}
                  onClick={async () => {
                    setMessage(undefined);
                    const stopPolling = startPolling();

                    try {
                      const created = await trpc.backups.create.mutate({ scope: scope(), mode: scope() === "full" ? mode() : undefined, note: note() || undefined });

                      setNote("");
                      setMessage({ kind: "success", text: `Made ${created.kind === "incremental" ? `an incremental backup of ${created.includedCount} of ${created.fileCount} files, ` : "a backup "}${created.kind === "incremental" ? "" : "of "}${formatSize(created.sizeBytes / 1048576)}.` });
                      await refetch();

                      return { state: AffirmativeButtonState.Success };
                    } catch (error) {
                      setMessage({ kind: "error", text: errorText(error, "The backup could not be made") });
                      await refetch();

                      return { state: AffirmativeButtonState.Error };
                    } finally {
                      stopPolling();
                    }
                  }}
                >
                  Back up now
                </UKButton>
              </div>
            </UKCard>
          </Section>

          <Section title="Schedule" description="Backups made on their own. The oldest scheduled backups are removed to keep to the number you choose, backups you make yourself are never removed.">
            <UKCard class={styles.card} color="filled">
              <div class={styles.row}>
                <div class={styles.heading}>
                  <UKText role="title" size="s">
                    Back up automatically
                  </UKText>
                </div>
                <UKSwitch value={scheduleEnabled()} onValueChange={setScheduleEnabled} />
              </div>
              <div class={styles.pair}>
                <UKTextField color="outlined" label="Hours between backups" value={intervalHours()} onValueChange={setIntervalHours} />
                <UKTextField color="outlined" label="Backups to keep" value={keep()} onValueChange={setKeep} />
              </div>
              <div class={styles.row}>
                <div class={styles.heading}>
                  <UKText role="title" size="s">
                    Include everyone's files
                  </UKText>
                  <UKText role="body" size="s" class={styles.hint}>
                    Off makes smaller backups of only the database and configuration.
                  </UKText>
                </div>
                <UKSwitch value={includeFiles()} onValueChange={setIncludeFiles} />
              </div>
              <Show when={includeFiles()}>
                <div class={styles.row}>
                  <div class={styles.heading}>
                    <UKText role="title" size="s">
                      Only back up what changed
                    </UKText>
                    <UKText role="body" size="s" class={styles.hint}>
                      Copies only the files which changed since the last backup. A restore then needs the earlier backups too, so they are kept for as long as one needs them.
                    </UKText>
                  </div>
                  <UKSwitch value={incremental()} onValueChange={setIncremental} />
                </div>
                <Show when={incremental()}>
                  <UKTextField color="outlined" label="Full backup every (backups)" value={fullEvery()} onValueChange={setFullEvery} />
                </Show>
              </Show>
              <Show when={overview()?.scheduleError}>
                {(failure) => (
                  <UKText role="body" size="m" class={styles.message} data-kind="error" align="start">
                    The last scheduled backup failed: {failure().message}
                  </UKText>
                )}
              </Show>
              <Show when={scheduleMessage()}>
                {(current) => (
                  <UKText role="body" size="m" class={styles.message} data-kind={current().kind} align="start">
                    {current().text}
                  </UKText>
                )}
              </Show>
              <div class={styles.actions}>
                <UKButton
                  affirmative
                  onClick={async () => {
                    setScheduleMessage(undefined);

                    const hours = Number(intervalHours());
                    const count = Number(keep());
                    const every = Number(fullEvery());

                    if (!Number.isInteger(hours) || hours < 1 || !Number.isInteger(count) || count < 1 || !Number.isInteger(every) || every < 1) {
                      setScheduleMessage({ kind: "error", text: "The hours, the number of backups to keep and how often a full backup is made must be whole numbers of at least 1" });

                      return { state: AffirmativeButtonState.Error };
                    }

                    try {
                      await trpc.backups.setSchedule.mutate({ enabled: scheduleEnabled(), intervalHours: hours, keep: count, includeFiles: includeFiles(), incremental: incremental(), fullEvery: every });
                      setScheduleMessage({ kind: "success", text: "Saved." });
                      await refetch();

                      return { state: AffirmativeButtonState.Success };
                    } catch (error) {
                      setScheduleMessage({ kind: "error", text: errorText(error, "The schedule could not be saved") });

                      return { state: AffirmativeButtonState.Error };
                    }
                  }}
                >
                  Save schedule
                </UKButton>
              </div>
            </UKCard>
          </Section>

          <Section title="Your backups">
            <UKCard class={styles.card} color="filled">
              <Show when={overview()?.backups.length} fallback={<UKText role="body" size="m" class={styles.hint} align="start">There are no backups yet.</UKText>}>
                <For each={overview()?.backups}>
                  {(backup) => (
                    <div class={styles.backup}>
                      <div class={styles.heading}>
                        <UKText role="title" size="s" align="start">
                          {new Date(backup.createdAt).toLocaleString()}
                        </UKText>
                        <UKText role="body" size="s" class={styles.hint} align="start">
                          {formatSize(backup.sizeBytes / 1048576)} · {backup.scope === "database" ? "Database only" : backup.kind === "incremental" ? `Only what changed (${backup.includedCount} of ${backup.fileCount} files)` : "Everything"} · {TRIGGER_LABELS[backup.trigger]}
                          {backup.note ? ` · ${backup.note}` : ""}
                        </UKText>
                      </div>
                      <div class={styles.backupActions}>
                        <a class={styles.download} href={`/api/backups/${backup.id}/download`} download="" aria-label="Download this backup" title="Download">
                          <UKIcon>{DOWNLOAD_ICON}</UKIcon>
                        </a>
                        <UKButton
                          color="tonal"
                          leadingIcon={RESTORE_ICON}
                          disabled={toolsMissing() || !!overview()?.job}
                          onClick={() => {
                            setRestorePassword("");
                            setRestoreError(undefined);
                            setRestoring(backup);
                          }}
                        >
                          Restore
                        </UKButton>
                        <UKButton color="tonal" leadingIcon={DELETE_ICON} disabled={!!overview()?.job} onClick={() => {
                          setDeleteError(undefined);
                          setDeleting(backup);
                        }}>
                          Delete
                        </UKButton>
                      </div>
                    </div>
                  )}
                </For>
              </Show>
            </UKCard>
          </Section>
        </div>
      </div>

      <UKDialog show={() => restoring() !== undefined} onClose={() => {
          if (!restored()) setRestoring(undefined);
        }} maxWidth="32rem">
        <div class={styles.dialog}>
          <UKText role="title" size="l">
            Restore this backup?
          </UKText>
          <Show
            when={!restored()}
            fallback={
              <UKText role="body" size="m" align="start">
                The backup was restored and the instance is restarting. You will need to sign in again.
              </UKText>
            }
          >
            <UKText role="body" size="m" align="start">
              Everything in the database {restoring()?.scope === "full" ? "and everyone's files are " : "is "}replaced with what was in the backup from {restoring() ? new Date(restoring()!.createdAt).toLocaleString() : ""}.
              {restoring()?.kind === "incremental" ? " The backups it continues from are used as well." : ""}
              Anything which has changed since is lost, and everyone is signed out. A backup of the instance as it is now is made first, so that this can be undone.
            </UKText>
            <UKTextField color="outlined" shouldMask label="Your password" value={restorePassword()} onValueChange={setRestorePassword} />
            <Show when={restoreError()}>
              <UKText role="body" size="m" class={styles.message} data-kind="error" align="start">
                {restoreError()}
              </UKText>
            </Show>
            <div class={styles.actions}>
              <UKButton color="tonal" onClick={() => {
                setRestoring(undefined);
              }}>
                Cancel
              </UKButton>
              <UKButton
                affirmative
                onClick={async () => {
                  setRestoreError(undefined);
                  const stopPolling = startPolling();

                  try {
                    await trpc.backups.restore.mutate({ id: restoring()!.id, password: restorePassword() || undefined });
                    setRestored(true);
                    setTimeout(() => navigate("/"), 6000);

                    return { state: AffirmativeButtonState.Success };
                  } catch (error) {
                    setRestoreError(errorText(error, "The backup could not be restored"));
                    await refetch();

                    return { state: AffirmativeButtonState.Error };
                  } finally {
                    stopPolling();
                  }
                }}
              >
                Restore
              </UKButton>
            </div>
          </Show>
        </div>
      </UKDialog>

      <UKDialog show={() => deleting() !== undefined} onClose={() => {
          setDeleting(undefined);
        }} maxWidth="28rem">
        <div class={styles.dialog}>
          <UKText role="title" size="l">
            Delete this backup?
          </UKText>
          <UKText role="body" size="m" align="start">
            The backup from {deleting() ? new Date(deleting()!.createdAt).toLocaleString() : ""} is removed from the server. This cannot be undone.
          </UKText>
          <Show when={deleteError()}>
            <UKText role="body" size="m" class={styles.message} data-kind="error" align="start">
              {deleteError()}
            </UKText>
          </Show>
          <div class={styles.actions}>
            <UKButton color="tonal" onClick={() => {
                setDeleting(undefined);
              }}>
              Cancel
            </UKButton>
            <UKButton
              affirmative
              onClick={async () => {
                try {
                  setDeleteError(undefined);
                  await trpc.backups.delete.mutate({ id: deleting()!.id });
                  setDeleting(undefined);
                  await refetch();

                  return { state: AffirmativeButtonState.Success };
                } catch (error) {
                  setDeleteError(errorText(error, "The backup could not be deleted"));

                  return { state: AffirmativeButtonState.Error };
                }
              }}
            >
              Delete
            </UKButton>
          </div>
        </div>
      </UKDialog>
    </>
  );
};

export default ManageInstanceBackupsPage;
