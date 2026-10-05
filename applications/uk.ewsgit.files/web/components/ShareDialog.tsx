import CONTENT_COPY_ICON from "@material-symbols/svg-700/outlined/content_copy.svg";
import LINK_OFF_ICON from "@material-symbols/svg-700/outlined/link_off.svg";
import LOCK_ICON from "@material-symbols/svg-700/outlined/lock.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKSegmentedButton from "@ewsgit/uikit-solid/src/components/segmentedButton/UKSegmentedButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createResource, createSignal, For, Show } from "solid-js";
import { pluralise } from "../lib/format";
import trpc from "../lib/trpc";
import type { Entry } from "../lib/types";
import styles from "./ShareDialog.module.scss";

type Expiry = "1" | "7" | "30" | "never";

const EXPIRY_ITEMS: { id: Expiry; label: string }[] = [
  { id: "1", label: "1 day" },
  { id: "7", label: "7 days" },
  { id: "30", label: "30 days" },
  { id: "never", label: "Never" },
];

const MIN_PASSWORD_LENGTH = 4;

const describeExpiry = (expiresAt: number | null) => (expiresAt === null ? "Never expires" : `Expires ${new Date(expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`);

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

const copy = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

/** Creates and manages public links to a single file. The link is only shown right after it is made, the server keeps just a hash of it. */
const ShareDialogContent: Component<{ entry: Entry; onClose: () => void; notify: (message: string) => void }> = (props) => {
  const [shares, { refetch }] = createResource(() => trpc.shares.list.query({ path: props.entry.path }));
  const [expiry, setExpiry] = createSignal<Expiry>("7");
  const [password, setPassword] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [link, setLink] = createSignal<string | undefined>();
  const [error, setError] = createSignal<string | undefined>();

  const create = async () => {
    if (password() !== "" && password().length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for the password, or leave it empty.`);
      return;
    }

    setBusy(true);
    setError(undefined);

    try {
      const created = await trpc.shares.create.mutate({
        path: props.entry.path,
        expiresInDays: expiry() === "never" ? null : (Number(expiry()) as 1 | 7 | 30),
        password: password() || undefined,
      });

      const url = new URL(created.link, window.location.origin).toString();
      setLink(url);
      setPassword("");
      await refetch();
      await copy(url).then(() => props.notify("Link copied"), () => undefined);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await trpc.shares.revoke.mutate({ id });
      setLink(undefined);
      await refetch();
      props.notify("Stopped sharing");
    } catch (failure) {
      props.notify(errorMessage(failure));
    }
  };

  return (
    <div class={styles.root}>
      <UKText role="title" size="l">
        Share "{props.entry.name}"
      </UKText>
      <UKText role="body" size="m" class={styles.muted}>
        Anyone with the link can download this file, they do not need an account. Changes you make to the file are shared too.
      </UKText>

      <Show when={link()}>
        {(url) => (
          <div class={styles.linkBox}>
            <UKText role="label" size="m" class={styles.muted}>
              Your new link. Copy it now, it cannot be shown again.
            </UKText>
            <div class={styles.linkRow}>
              <input class={styles.linkInput} readOnly value={url()} onFocus={(event) => event.currentTarget.select()} aria-label="Share link" />
              <UKIconButton color="standard" icon={CONTENT_COPY_ICON} alt="Copy link" onClick={() => copy(url()).then(() => props.notify("Link copied"), () => props.notify("Could not copy, select the link and copy it by hand"))} />
            </div>
          </div>
        )}
      </Show>

      <UKText role="label" size="l">
        Link expires after
      </UKText>
      <UKSegmentedButton selectedId={expiry} onSelect={(id) => setExpiry(id as Expiry)} items={EXPIRY_ITEMS} />

      <UKTextField color="outlined" shouldMask label="Password (optional)" supportingText="Anyone opening the link will have to enter it" autocomplete="new-password" value={password()} onValueChange={setPassword} onSubmit={create} />

      <Show when={error()}>
        <UKText role="body" size="m" class={styles.error}>
          {error()}
        </UKText>
      </Show>

      <div class={styles.buttons}>
        <UKButton color="standard" onClick={props.onClose}>
          Done
        </UKButton>
        <UKButton color="filled" disabled={busy()} onClick={create}>
          Create link
        </UKButton>
      </div>

      <Show when={shares.latest && shares.latest.length > 0}>
        <UKDivider direction="horizontal" />
        <UKText role="label" size="l">
          Active links
        </UKText>
        <div class={styles.list}>
          <For each={shares.latest}>
            {(share) => (
              <div class={styles.item}>
                <div class={styles.itemText}>
                  <UKText role="body" size="m">
                    {describeExpiry(share.expiresAt)}
                  </UKText>
                  <UKText role="body" size="s" class={styles.muted}>
                    <Show when={share.hasPassword}>
                      <UKIcon class={styles.lock}>{LOCK_ICON}</UKIcon>{" "}
                    </Show>
                    Created {new Date(share.createdAt).toLocaleDateString()} · {pluralise(share.downloads, "download")}
                  </UKText>
                </div>
                <UKIconButton color="standard" icon={LINK_OFF_ICON} alt="Stop sharing this link" onClick={() => revoke(share.id)} />
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={shares.loading && !shares.latest}>
        <UKCircularProgressIndicator class={styles.spinner} />
      </Show>
    </div>
  );
};

export default ShareDialogContent;
