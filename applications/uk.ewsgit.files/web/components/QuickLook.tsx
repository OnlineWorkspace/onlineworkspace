import ARROW_BACK_ICON from "@material-symbols/svg-700/outlined/arrow_back.svg";
import ARROW_FORWARD_ICON from "@material-symbols/svg-700/outlined/arrow_forward.svg";
import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import DOWNLOAD_ICON from "@material-symbols/svg-700/outlined/download.svg";
import OPEN_IN_NEW_ICON from "@material-symbols/svg-700/outlined/open_in_new.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createEffect, createResource, createSignal, Match, on, Show, Switch } from "solid-js";
import { formatBytes, formatModified, pluralise } from "../lib/format";
import trpc from "../lib/trpc";
import type { Entry } from "../lib/types";
import FileBadge from "./FileBadge";
import styles from "./QuickLook.module.scss";

// reading a bigger file into the page just to show its first lines is not worth it
const MAX_TEXT_BYTES = 512 * 1024;

const kindOf = (entry: Entry): "image" | "video" | "audio" | "pdf" | "text" | "none" => {
  if (entry.kind === "directory") return "none";
  if (entry.category === "image" && entry.extension !== "heic" && entry.extension !== "tiff") return "image";
  if (entry.category === "video" || entry.category === "audio" || entry.category === "pdf") return entry.category;
  if ((entry.category === "text" || entry.category === "code") && entry.size <= MAX_TEXT_BYTES) return "text";
  return "none";
};

/** A large preview of one item, like macOS "Quick Look". Keys (space, escape, arrows) are handled by the file browser. */
const QuickLook: Component<{
  entry: Entry;
  // "2 of 5", shown when there is more than one item to move between
  position?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onClose: () => void;
  onOpen: () => void;
  onDownload: () => void;
}> = (props) => {
  const kind = () => kindOf(props.entry);
  const [broken, setBroken] = createSignal(false);

  createEffect(on(() => props.entry.path, () => setBroken(false)));

  const [url] = createResource(
    () => (kind() === "none" ? undefined : props.entry.path),
    (path) => trpc.fileUrl.query({ path }).catch(() => undefined),
  );

  const [text] = createResource(
    () => (kind() === "text" ? url() : undefined),
    async (source) => {
      const response = await fetch(source, { credentials: "include" });
      return response.ok ? response.text() : undefined;
    },
  );

  const fallback = () => (
    <div class={styles.fallback}>
      <FileBadge entry={props.entry} size="l" />
      <UKText role="body" size="m" class={styles.muted}>
        {props.entry.kind === "directory" ? pluralise(props.entry.itemCount ?? 0, "item") : "No preview available for this file"}
      </UKText>
    </div>
  );

  const loading = () => <UKCircularProgressIndicator class={styles.spinner} />;

  return (
    <UKDialog show={() => true} onClose={props.onClose} maxWidth="min(64rem, 94vw)">
      <div class={styles.root}>
        <div class={styles.header}>
          <div class={styles.title}>
            <UKText role="title" size="m" class={styles.name}>
              {props.entry.name}
            </UKText>
            <UKText role="body" size="s" class={styles.muted}>
              {props.entry.typeLabel}
              {props.entry.kind === "file" ? ` · ${formatBytes(props.entry.size)}` : ""} · {formatModified(props.entry.modified, true)}
              {props.position ? ` · ${props.position}` : ""}
            </UKText>
          </div>
          <Show when={props.onPrevious}>
            <UKIconButton color="standard" icon={ARROW_BACK_ICON} alt="Previous" onClick={props.onPrevious!} />
          </Show>
          <Show when={props.onNext}>
            <UKIconButton color="standard" icon={ARROW_FORWARD_ICON} alt="Next" onClick={props.onNext!} />
          </Show>
          <UKIconButton color="standard" icon={CLOSE_ICON} alt="Close preview" onClick={props.onClose} />
        </div>

        <div class={styles.stage}>
          <Switch fallback={fallback()}>
            <Match when={kind() !== "none" && !broken() && url.loading}>{loading()}</Match>
            <Match when={url() && !broken() && kind() === "image"}>
              <img class={styles.media} src={url()} alt={props.entry.name} onError={() => setBroken(true)} />
            </Match>
            <Match when={url() && !broken() && kind() === "video"}>
              <video class={styles.media} src={url()} controls autoplay onError={() => setBroken(true)} />
            </Match>
            <Match when={url() && !broken() && kind() === "audio"}>
              <div class={styles.fallback}>
                <FileBadge entry={props.entry} size="l" />
                <audio class={styles.audio} src={url()} controls autoplay onError={() => setBroken(true)} />
              </div>
            </Match>
            <Match when={url() && !broken() && kind() === "pdf"}>
              <iframe class={styles.frame} src={url()} title={props.entry.name} />
            </Match>
            <Match when={kind() === "text" && text.loading}>{loading()}</Match>
            <Match when={kind() === "text" && text() !== undefined}>
              <pre class={styles.text}>{text()}</pre>
            </Match>
          </Switch>
        </div>

        <div class={styles.footer}>
          <UKText role="body" size="s" class={styles.muted}>
            Space or Esc to close{props.onNext ? " · ← → to browse" : ""}
          </UKText>
          <Show when={props.entry.kind === "file"}>
            <UKButton color="tonal" leadingIcon={DOWNLOAD_ICON} onClick={props.onDownload}>
              Download
            </UKButton>
          </Show>
          <UKButton color="filled" leadingIcon={OPEN_IN_NEW_ICON} onClick={props.onOpen}>
            Open
          </UKButton>
        </div>
      </div>
    </UKDialog>
  );
};

export default QuickLook;
