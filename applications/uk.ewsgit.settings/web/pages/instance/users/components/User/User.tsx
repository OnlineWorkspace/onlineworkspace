import SHIELD_PERSON_ICON from "@material-symbols/svg-700/outlined/shield_person.svg";
import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKChip from "@ewsgit/uikit-solid/src/components/chip/UKChip.tsx";
import UKButton, {
  AffirmativeButtonState,
} from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKSegmentedButton from "@ewsgit/uikit-solid/src/components/segmentedButton/UKSegmentedButton.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import {
  type Component,
  createEffect,
  createResource,
  createSignal,
  Show,
  useContext,
} from "solid-js";
import { AppContext } from "../../../../../appContext.ts";
import trpc from "../../../../../lib/trpc";
import { formatSize } from "../../../../storage/formatSize.ts";
import styles from "./User.module.scss";

const QUOTA_UNITS = { MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 } as const;
type QuotaUnit = keyof typeof QUOTA_UNITS;

/** the largest unit which shows the size as a number of at least 1 */
const splitQuota = (bytes: number): { amount: string; unit: QuotaUnit } => {
  const unit: QuotaUnit = bytes >= QUOTA_UNITS.TB ? "TB" : bytes >= QUOTA_UNITS.GB ? "GB" : "MB";

  return { amount: String(Number((bytes / QUOTA_UNITS[unit]).toFixed(2))), unit };
};

const User: Component<{
  userId: number;
  /** only users matching this text (name, username or email) are listed */
  query: string;
  updateUsers: () => void;
  removeUser: (userId: number) => void;
}> = (props) => {
  const appContext = useContext(AppContext)!;
  const [showDialog, setShowDialog] = createSignal<
    "user" | "confirmDelete" | "removeOwnAdmin" | "invalidateSessions" | "resetPassword" | "resetTwoFactor" | undefined
  >(undefined);
  const [username, { mutate: setUsername }] = createResource(
    () => trpc.instance.user.getUsername.query(props.userId),
    {
      initialValue: "",
    },
  );
  const [email, { mutate: setEmail }] = createResource(
    () => trpc.instance.user.getEmail.query(props.userId),
    {
      initialValue: "",
    },
  );
  const [displayNameValue, { mutate: setDisplayName }] = createResource(
    () => trpc.instance.user.getDisplayName.query(props.userId),
    {
      initialValue: "",
    },
  );
  const [isAdministrator, { mutate: setIsAdministrator }] = createResource(
    () => trpc.instance.user.getIsAdministrator.query(props.userId),
    {
      initialValue: false,
    },
  );
  const [storage, { refetch: refetchStorage }] = createResource(
    // only looked up once the user's dialog is open, working out how much a user has stored can take a while
    () => showDialog() === "user" || undefined,
    () => trpc.instance.user.getStorage.query({ userId: props.userId }),
  );
  const [twoFactor, { refetch: refetchTwoFactor }] = createResource(
    () => showDialog() === "user" || undefined,
    () => trpc.instance.user.getTwoFactorStatus.query({ userId: props.userId }),
  );
  const hasTwoFactor = () => !!twoFactor() && (twoFactor()!.authenticator || twoFactor()!.passkey);
  const [quotaUnlimited, setQuotaUnlimited] = createSignal(false);
  const [quotaAmount, setQuotaAmount] = createSignal("1");
  const [quotaUnit, setQuotaUnit] = createSignal<QuotaUnit>("GB");
  const [quotaMessage, setQuotaMessage] = createSignal<{ kind: "error" | "success"; text: string }>();

  // the quota fields start from what is saved
  createEffect(() => {
    const current = storage();

    if (!current) return;

    setQuotaUnlimited(current.quotaBytes === 0);

    if (current.quotaBytes > 0) {
      const { amount, unit } = splitQuota(current.quotaBytes);

      setQuotaAmount(amount);
      setQuotaUnit(unit);
    }
  });

  const quotaBytes = () => {
    if (quotaUnlimited()) return 0;

    const amount = Number(quotaAmount());

    return Number.isFinite(amount) && amount > 0 ? Math.round(amount * QUOTA_UNITS[quotaUnit()]) : undefined;
  };
  const quotaChanged = () => {
    const bytes = quotaBytes();

    return bytes !== undefined && !!storage() && bytes !== storage()!.quotaBytes;
  };
  const [newPassword, setNewPassword] = createSignal("");
  const [newPasswordRepeat, setNewPasswordRepeat] = createSignal("");
  const [isMe] = createResource(
    () => trpc.instance.user.getIsMe.query(props.userId),
    {
      initialValue: false,
    },
  );

  const displayName = () => {
    return displayNameValue().trim() || username();
  };

  const matchesQuery = () => {
    const query = props.query.trim().toLowerCase();

    return query === "" || [displayName(), username(), email()].some((value) => value.toLowerCase().includes(query));
  };

  return (
    <>
      <Show when={matchesQuery()}>
        <UKCard class={styles.row} onClick={() => void setShowDialog("user")}>
          <UKAvatar size="m" username={username()} avatar={`${window.location.origin}/api/user/${encodeURIComponent(username())}/avatar/m`} />
          <div class={styles.info}>
            <UKText role="title" size="m" align="start">
              {displayName()}
            </UKText>
            <UKText role="body" size="s" align="start" class={styles.details}>
              {`@${username()}${email() ? ` · ${email()}` : ""}`}
            </UKText>
          </div>
          <div class={styles.badges}>
            <Show when={isMe()}>
              <UKChip type="assist">You</UKChip>
            </Show>
            <Show when={isAdministrator()}>
              <UKChip type="assist" leading={{ type: "icon", value: SHIELD_PERSON_ICON }}>
                Administrator
              </UKChip>
            </Show>
          </div>
        </UKCard>
      </Show>

      <UKDialog show={() => showDialog() === "user"} onClose={() => setShowDialog(undefined)} maxWidth="60rem">
        <div class={styles.expanded}>
          <div class={styles.dialogHeader}>
            <UKAvatar size="l" username={username()} avatar={`${window.location.origin}/api/user/${encodeURIComponent(username())}/avatar/l`} />
            <div class={styles.info}>
              <UKText role="title" size="l" align="start">
                {displayName()}
              </UKText>
              <UKText role="body" size="m" align="start" class={styles.details}>
                {`@${username()}`}
              </UKText>
            </div>
            <div class={styles.badges}>
              <Show when={isMe()}>
                <UKChip type="assist">You</UKChip>
              </Show>
              <Show when={isAdministrator()}>
                <UKChip type="assist" leading={{ type: "icon", value: SHIELD_PERSON_ICON }}>
                  Administrator
                </UKChip>
              </Show>
            </div>
          </div>

          <div class={styles.columns}>
            <div class={styles.column}>
          <section class={styles.section}>
            <UKText role="label" size="l" emphasized class={styles.sectionTitle}>
              Profile
            </UKText>
            <UKTextField
              color="outlined"
              onValueChange={async (val) => {
                if (val === username()) return;

                setUsername(val);
                await trpc.instance.user.setUsername.mutate({
                  userId: props.userId,
                  username: val,
                });
              }}
              defaultValue={username()}
              label="Username"
              value={username()}
            />
            <UKTextField
              color="outlined"
              onValueChange={async (val) => {
                if (val === displayNameValue()) return;

                setDisplayName(val);
                await trpc.instance.user.setDisplayName.mutate({
                  userId: props.userId,
                  displayName: val,
                });
              }}
              defaultValue={displayNameValue()}
              label="Display name"
              value={displayNameValue()}
            />
            <UKTextField
              color="outlined"
              onValueChange={async (val) => {
                if (val === email()) return;

                setEmail(val);
                await trpc.instance.user.setEmail.mutate({
                  userId: props.userId,
                  email: val,
                });
              }}
              defaultValue={email()}
              label="Email"
              value={email()}
            />
            <UKText role="body" size="s" class={styles.hint}>
              Changes to these fields are saved as you make them.
            </UKText>
          </section>

          <section class={styles.section}>
            <UKText role="label" size="l" emphasized class={styles.sectionTitle}>
              Access
            </UKText>
            <div class={styles.setting}>
              <div class={styles.settingText}>
                <UKText role="title" size="s" align="start">
                  Administrator
                </UKText>
                <UKText role="body" size="s" align="start" class={styles.hint}>
                  Can manage users, features and the settings of this instance.
                </UKText>
              </div>
              <UKSwitch
                disabled={isMe() && !appContext.shootYourselfInTheFoot()}
                onValueChange={async (val) => {
                  if (isMe() && !val) {
                    setShowDialog("removeOwnAdmin");
                    return;
                  }
                  setIsAdministrator(val);
                  await trpc.instance.user.setIsAdministrator.mutate({
                    administrator: val,
                    userId: props.userId,
                  });
                }}
                value={isAdministrator()}
              />
            </div>
          </section>

          <section class={styles.section}>
            <UKText role="label" size="l" emphasized class={styles.sectionTitle}>
              Storage
            </UKText>
            <Show when={storage()}>
              {(current) => (
                <UKText role="body" size="s" align="start" class={styles.hint}>
                  {formatSize(current().usedBytes / 1048576)} used of {current().quotaBytes === 0 ? "unlimited storage" : formatSize(current().quotaBytes / 1048576)}.
                </UKText>
              )}
            </Show>
            <Show when={!quotaUnlimited()}>
              <div class={styles.quota}>
                <UKTextField color="outlined" label="Storage quota" value={quotaAmount()} onValueChange={setQuotaAmount} />
                <UKSegmentedButton
                  items={(Object.keys(QUOTA_UNITS) as QuotaUnit[]).map((unit) => ({ id: unit, label: unit }))}
                  selectedId={quotaUnit}
                  onSelect={(id) => setQuotaUnit(id as QuotaUnit)}
                  showCheck={false}
                />
              </div>
              <Show when={quotaBytes() !== undefined && storage() && quotaBytes()! > 0 && quotaBytes()! < storage()!.usedBytes}>
                <UKText role="body" size="s" align="start" class={styles.hint}>
                  This is less than the user already has stored. Nothing is deleted, but they cannot add more until they are under it.
                </UKText>
              </Show>
            </Show>
            <div class={styles.setting}>
              <div class={styles.settingText}>
                <UKText role="title" size="s" align="start">
                  Unlimited
                </UKText>
                <UKText role="body" size="s" align="start" class={styles.hint}>
                  No limit on how much this user can store.
                </UKText>
              </div>
              <UKSwitch value={quotaUnlimited()} onValueChange={setQuotaUnlimited} />
            </div>
            <Show when={quotaMessage()}>
              {(current) => (
                <UKText role="body" size="s" align="start" class={styles.quotaMessage} data-kind={current().kind}>
                  {current().text}
                </UKText>
              )}
            </Show>
            <UKButton
              affirmative
              color="tonal"
              class={styles.closeButton}
              disabled={!quotaChanged()}
              onClick={async () => {
                setQuotaMessage(undefined);

                try {
                  await trpc.instance.user.setQuota.mutate({ userId: props.userId, quotaBytes: quotaBytes()! });
                  await refetchStorage();
                  setQuotaMessage({ kind: "success", text: "Saved." });

                  return { state: AffirmativeButtonState.Success };
                } catch (error) {
                  setQuotaMessage({ kind: "error", text: error instanceof Error ? error.message : "The quota could not be saved" });

                  return { state: AffirmativeButtonState.Error };
                }
              }}
            >
              Save quota
            </UKButton>
          </section>

            </div>
            <div class={styles.column}>
          <section class={styles.section}>
            <UKText role="label" size="l" emphasized class={styles.sectionTitle}>
              Security
            </UKText>
            <div class={styles.setting}>
              <div class={styles.settingText}>
                <UKText role="title" size="s" align="start">
                  Sign out everywhere
                </UKText>
                <UKText role="body" size="s" align="start" class={styles.hint}>
                  Ends every session on every device.
                </UKText>
              </div>
              <UKButton color={"tonal"} onClick={() => void setShowDialog("invalidateSessions")}>
                Invalidate sessions
              </UKButton>
            </div>
            <div class={styles.setting}>
              <div class={styles.settingText}>
                <UKText role="title" size="s" align="start">
                  Password
                </UKText>
                <UKText role="body" size="s" align="start" class={styles.hint}>
                  Set a new password. Their sessions are signed out.
                </UKText>
              </div>
              <UKButton
                color={"tonal"}
                onClick={() => {
                  setNewPassword("");
                  setNewPasswordRepeat("");
                  setShowDialog("resetPassword");
                }}
              >
                Reset password
              </UKButton>
            </div>
            <div class={styles.setting}>
              <div class={styles.settingText}>
                <UKText role="title" size="s" align="start">
                  Two-factor authentication
                </UKText>
                <UKText role="body" size="s" align="start" class={styles.hint}>
                  {!twoFactor()
                    ? "Checking..."
                    : hasTwoFactor()
                      ? `Set up with ${[twoFactor()!.authenticator && "an authenticator app", twoFactor()!.passkey && "a passkey"].filter(Boolean).join(" and ")}. Reset it if they have lost access.`
                      : "Not set up."}
                </UKText>
              </div>
              <UKButton color={"tonal"} disabled={!hasTwoFactor()} onClick={() => void setShowDialog("resetTwoFactor")}>
                Reset 2FA
              </UKButton>
            </div>
            <div class={styles.setting}>
              <div class={styles.settingText}>
                <UKText role="title" size="s" align="start">
                  Test notification
                </UKText>
                <UKText role="body" size="s" align="start" class={styles.hint}>
                  Sends this user a notification.
                </UKText>
              </div>
              <UKButton
                color={"standard"}
                onClick={async () => {
                  await trpc.instance.user.boop.mutate({ userId: props.userId });
                }}
              >
                Boop
              </UKButton>
            </div>
          </section>

          <section class={styles.section}>
            <UKText role="label" size="l" emphasized class={styles.sectionTitle}>
              Danger zone
            </UKText>
            <div class={styles.setting}>
              <div class={styles.settingText}>
                <UKText role="title" size="s" align="start">
                  Delete user
                </UKText>
                <UKText role="body" size="s" align="start" class={styles.hint}>
                  Permanently removes this account. This cannot be undone.
                </UKText>
              </div>
              <UKButton color={"outlined"} onClick={() => void setShowDialog("confirmDelete")}>
                Delete
              </UKButton>
            </div>
          </section>

            </div>
          </div>

          <UKButton class={styles.closeButton} color={"filled"} onClick={() => setShowDialog(undefined)}>
            Done
          </UKButton>
        </div>
      </UKDialog>

      <UKDialog
        maxWidth="28rem"
        show={() => showDialog() === "invalidateSessions"}
        onClose={() => setShowDialog("user")}
      >
        <UKText role="title" size="l">
          Invalidate All Sessions
        </UKText>
        <UKDivider direction="horizontal" />
        <UKText role="body" size="m">
          This will sign {isMe() ? "you" : "the user"} out of every device.
        </UKText>
        <UKButtonGroup size={"s"} align={"end"}>
          <UKButton
            affirmative={true}
            color={"tonal"}
            onClick={async () => {
              await trpc.instance.user.invalidateSessions.mutate({
                userId: props.userId,
              });

              return {
                state: AffirmativeButtonState.Success,
                cb() {
                  setShowDialog("user");
                },
              };
            }}
          >
            Yes, invalidate
          </UKButton>
          <UKButton color={"filled"} onClick={() => void setShowDialog("user")}>
            Cancel
          </UKButton>
        </UKButtonGroup>
      </UKDialog>

      <UKDialog
        maxWidth="28rem"
        show={() => showDialog() === "resetTwoFactor"}
        onClose={() => setShowDialog("user")}
      >
        <UKText role="title" size="l">
          Reset Two-Factor Authentication
        </UKText>
        <UKDivider direction="horizontal" />
        <UKText role="body" size="m">
          This removes {isMe() ? "your" : "the user's"} authenticator app and passkeys and signs {isMe() ? "you" : "them"} out of every device.
          {isAdministrator() ? " Administrators must set up two-factor authentication again before they can use the instance." : ""}
        </UKText>
        <UKButtonGroup size={"s"} align={"end"}>
          <UKButton
            affirmative={true}
            color={"tonal"}
            onClick={async () => {
              await trpc.instance.user.resetTwoFactor.mutate({ userId: props.userId });
              await refetchTwoFactor();

              return {
                state: AffirmativeButtonState.Success,
                cb() {
                  setShowDialog("user");
                },
              };
            }}
          >
            Yes, reset
          </UKButton>
          <UKButton color={"filled"} onClick={() => void setShowDialog("user")}>
            Cancel
          </UKButton>
        </UKButtonGroup>
      </UKDialog>

      <UKDialog
        maxWidth="28rem"
        show={() => showDialog() === "resetPassword"}
        onClose={() => setShowDialog("user")}
      >
        <div class={styles.expanded}>
          <UKText role="title" size="l">
            Reset Password
          </UKText>
          <UKDivider direction="horizontal" />
          <UKText role="body" size="m">
            Set a new password for this user. All of their sessions will be
            signed out.
          </UKText>
          <UKTextField
            color="outlined"
            shouldMask
            label="New Password"
            onValueChange={setNewPassword}
            value={newPassword()}
            defaultValue={newPassword()}
          />
          <UKTextField
            color="outlined"
            shouldMask
            label="Re-Enter New Password"
            onValueChange={setNewPasswordRepeat}
            value={newPasswordRepeat()}
            defaultValue={newPasswordRepeat()}
          />
          <UKButtonGroup size={"s"} align={"end"}>
            <UKButton
              affirmative={true}
              color={"tonal"}
              disabled={
                !(
                  newPassword() === newPasswordRepeat() &&
                  newPassword().length > 3
                )
              }
              onClick={async () => {
                await trpc.instance.user.resetPassword.mutate({
                  userId: props.userId,
                  password: newPassword(),
                });

                return {
                  state: AffirmativeButtonState.Success,
                  cb() {
                    setNewPassword("");
                    setNewPasswordRepeat("");
                    setShowDialog("user");
                  },
                };
              }}
            >
              Confirm
            </UKButton>
            <UKButton color={"filled"} onClick={() => void setShowDialog("user")}>
              Cancel
            </UKButton>
          </UKButtonGroup>
        </div>
      </UKDialog>

      <UKDialog
        maxWidth="28rem"
        show={() => showDialog() === "confirmDelete"}
        onClose={() => setShowDialog(undefined)}
      >
        <UKText role="title" size="l">
          Confirm Deletion
        </UKText>
        <UKDivider direction="horizontal" />
        <Show when={!isMe()}>
          <UKText role="body" size="m">
            Are you sure you want to delete this user? This action cannot be
            undone.
          </UKText>
          <UKButtonGroup size={"s"} align={"end"}>
            <UKButton
              affirmative={true}
              color={"tonal"}
              onClick={async () => {
                await trpc.instance.user.delete.mutate({
                  userId: props.userId,
                });

                return {
                  state: AffirmativeButtonState.Success,
                  cb() {
                    props.removeUser(props.userId);
                  },
                };
              }}
            >
              Yes, delete
            </UKButton>
            <UKButton color={"filled"} onClick={() => setShowDialog(undefined)}>
              No, cancel
            </UKButton>
          </UKButtonGroup>
        </Show>
        <Show when={isMe()}>
          <UKText role="body" size="m">
            Sorry, you cannot delete your own user account. Please ask another
            administrator to delete your account if you wish to do so.
          </UKText>
          <UKButton color={"filled"} onClick={() => setShowDialog(undefined)}>
            Close
          </UKButton>
        </Show>
      </UKDialog>

      <UKDialog
        maxWidth="28rem"
        show={() => showDialog() === "removeOwnAdmin"}
        onClose={() => setShowDialog(undefined)}
      >
        <UKText role="title" size="l">
          Remove Administrator Privileges
        </UKText>
        <UKDivider direction="horizontal" />
        <UKText role="body" size="m">
          Are you sure you want to remove your own administrator privileges? You
          will not be able to modify any users or settings if you do this.
          Please ask another administrator or use the console if you need to
          restore your privileges.
        </UKText>
        <UKButtonGroup size={"s"} align={"end"}>
          <UKButton
            color={"tonal"}
            onClick={async () => {
              setIsAdministrator(false);
              await trpc.instance.user.setIsAdministrator.mutate({
                administrator: false,
                userId: props.userId,
              });
              setShowDialog(undefined);
            }}
          >
            Yes, remove
          </UKButton>
          <UKButton
            color={"filled"}
            onClick={() => {
              setShowDialog("user");
            }}
          >
            Cancel
          </UKButton>
        </UKButtonGroup>
      </UKDialog>
    </>
  );
};

export default User;
