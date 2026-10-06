import CHECK_ICON from "@material-symbols/svg-700/outlined/check_circle.svg";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import ERROR_ICON from "@material-symbols/svg-700/outlined/error.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKSegmentedButton from "@ewsgit/uikit-solid/src/components/segmentedButton/UKSegmentedButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, createSignal, For, on, Show } from "solid-js";
import baseSettingsPageStyles from "../../../BaseSettingsPage.module.scss";
import trpc from "../../../lib/trpc.ts";
import styles from "./index.module.scss";

type Entry = Awaited<ReturnType<typeof trpc.audit.list.query>>["entries"][number];

/** what each action is called, an action which is not here is shown as it is named */
const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign in",
  "auth.lockout": "Locked out of an account",
  "auth.logout": "Signed out",
  "auth.logout_everywhere": "Signed out of every device",
  "auth.session_revoked": "Removed a signed in device",
  "auth.password_changed": "Changed their password",
  "auth.password_change_failed": "Failed to change their password",
  "auth.password_reset_requested": "Asked for a password reset",
  "auth.password_reset": "Reset their password",
  "auth.two_factor_enabled": "Set up two factor authentication",
  "auth.passkey_added": "Added a passkey",
  "auth.passkey_removed": "Removed a passkey",
  "auth.signup": "Signed up",
  "user.created": "Created a user",
  "user.deleted": "Deleted a user",
  "user.administrator_granted": "Made a user an administrator",
  "user.administrator_revoked": "Removed a user's administrator rights",
  "user.quota_changed": "Changed a user's storage quota",
  "user.two_factor_reset": "Reset a user's two factor authentication",
  "user.sessions_ended": "Signed a user out everywhere",
  "user.password_reset_by_administrator": "Reset a user's password",
  "instance.feature_changed": "Changed a feature",
  "instance.update_checked": "Checked for updates",
  "instance.setup_completed": "Finished setting up the instance",
  "backup.created": "Made a backup",
  "backup.deleted": "Deleted a backup",
  "backup.downloaded": "Downloaded a backup",
  "backup.restored": "Restored a backup",
  "backup.schedule_changed": "Changed the backup schedule",
};

const CATEGORIES = [
  { id: "all", label: "Everything", prefix: undefined },
  { id: "auth", label: "Sign ins", prefix: "auth." },
  { id: "user", label: "Users", prefix: "user." },
  { id: "instance", label: "Instance", prefix: "instance." },
  { id: "backup", label: "Backups", prefix: "backup." },
  { id: "admin", label: "Other", prefix: "admin." },
] as const;

const labelFor = (action: string) => ACTION_LABELS[action] ?? (action.startsWith("admin.") ? `Administrator: ${action.slice("admin.".length)}` : action);

const detailsText = (details: Entry["details"]) =>
  details
    ? Object.entries(details)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, " $1").toLowerCase()}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
        .join(", ")
    : "";

const ManageInstanceAuditLogPage: Component = () => {
  const navigate = useNavigate();
  const [category, setCategory] = createSignal<(typeof CATEGORIES)[number]["id"]>("all");
  const [outcome, setOutcome] = createSignal<"all" | "success" | "failure">("all");
  const [search, setSearch] = createSignal("");
  const [entries, setEntries] = createSignal<Entry[]>([]);
  const [hasMore, setHasMore] = createSignal(false);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string>();

  const load = async (append: boolean) => {
    setLoading(true);
    setError(undefined);

    try {
      const result = await trpc.audit.list.query({
        limit: 50,
        before: append ? entries().at(-1)?.id : undefined,
        action: CATEGORIES.find((c) => c.id === category())?.prefix,
        outcome: (outcome() === "all" ? undefined : outcome()) as "success" | "failure" | undefined,
        search: search().trim() || undefined,
      });

      setEntries(append ? [...entries(), ...result.entries] : result.entries);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The audit log could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  // filters start the list again, typing waits a moment so that it is not looked up for every letter
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  createEffect(
    on([category, outcome, search], () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => void load(false), 250);
    }),
  );

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Audit log"}
        subtitle={"Who did what on this instance."}
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
          <UKCard class={styles.filters} color="filled">
            <UKTextField color="outlined" label="Search people, addresses and actions" value={search()} onValueChange={setSearch} />
            <UKSegmentedButton items={CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} selectedId={category} onSelect={(id) => setCategory(id as (typeof CATEGORIES)[number]["id"])} />
            <UKSegmentedButton
              items={[
                { id: "all", label: "Any result" },
                { id: "success", label: "Succeeded" },
                { id: "failure", label: "Failed" },
              ]}
              selectedId={outcome}
              onSelect={(id) => setOutcome(id as "all" | "success" | "failure")}
            />
          </UKCard>

          <Show when={error()}>
            <UKText role="body" size="m" class={styles.error} align="start">
              {error()}
            </UKText>
          </Show>

          <UKCard class={styles.list} color="filled">
            <Show when={entries().length > 0 || loading()} fallback={<UKText role="body" size="m" class={styles.hint} align="start">Nothing has been recorded which matches.</UKText>}>
              <For each={entries()}>
                {(entry) => (
                  <div class={styles.entry} data-outcome={entry.outcome}>
                    <UKIcon class={styles.outcome}>{entry.outcome === "success" ? CHECK_ICON : ERROR_ICON}</UKIcon>
                    <div class={styles.body}>
                      <UKText role="title" size="s" align="start">
                        {labelFor(entry.action)}
                        <Show when={entry.target}>
                          <span class={styles.target}> · {entry.target}</span>
                        </Show>
                      </UKText>
                      <UKText role="body" size="s" class={styles.hint} align="start">
                        {entry.actorName ?? "Nobody signed in"}
                        {entry.ip ? ` · ${entry.ip}` : ""}
                        {detailsText(entry.details) ? ` · ${detailsText(entry.details)}` : ""}
                      </UKText>
                    </div>
                    <UKText role="label" size="m" class={styles.time} align="end">
                      {new Date(entry.createdAt).toLocaleString()}
                    </UKText>
                  </div>
                )}
              </For>
            </Show>
            <Show when={loading()}>
              <div class={styles.loading}>
                <UKCircularProgressIndicator />
              </div>
            </Show>
            <Show when={hasMore() && !loading()}>
              <div class={styles.more}>
                <UKButton color="tonal" onClick={() => void load(true)}>
                  Show older entries
                </UKButton>
              </div>
            </Show>
          </UKCard>
        </div>
      </div>
    </>
  );
};

export default ManageInstanceAuditLogPage;
