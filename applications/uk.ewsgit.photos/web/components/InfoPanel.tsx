import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import CALENDAR_TODAY_ICON from "@material-symbols/svg-700/outlined/calendar_today.svg";
import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import CLOUD_DONE_ICON from "@material-symbols/svg-700/outlined/cloud_done.svg";
import IMAGE_ICON from "@material-symbols/svg-700/outlined/image.svg";
import LOCATION_ON_ICON from "@material-symbols/svg-700/outlined/location_on.svg";
import PHOTO_CAMERA_ICON from "@material-symbols/svg-700/outlined/photo_camera.svg";
import PLAY_CIRCLE_ICON from "@material-symbols/svg-700/outlined/play_circle.svg";
import UKChip from "@ewsgit/uikit-solid/src/components/chip/UKChip.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, For, type JSX, Show } from "solid-js";
import { usePhotos } from "../lib/context";
import { clockTime, formatBytes, viewerDay } from "../lib/format";
import { errorMessage } from "../lib/media";
import trpc from "../lib/trpc";
import type { MediaDetail } from "./viewerTypes";
import styles from "./InfoPanel.module.scss";

const Row: Component<{ icon: string; title: string; subtitle?: string; onClick?: () => void; action?: JSX.Element }> = (props) => {
  const content = () => (
    <>
      <UKIcon class={styles.rowIcon}>{props.icon}</UKIcon>
      <div class={styles.rowText}>
        <UKText role="body" size="l" class={styles.rowTitle}>
          {props.title}
        </UKText>
        <Show when={props.subtitle}>
          <UKText role="body" size="m" class={styles.rowSubtitle}>
            {props.subtitle}
          </UKText>
        </Show>
      </div>
    </>
  );

  return (
    <Show when={props.onClick} fallback={<div class={styles.row}>{content()}</div>}>
      <button type="button" class={styles.row} data-clickable="true" onClick={props.onClick}>
        {content()}
      </button>
    </Show>
  );
};

/** Everything known about one photo, and the parts of it that can be changed: description, location and albums. */
const InfoPanel: Component<{
  detail: MediaDetail;
  // shown as a close button in the side panel, left out in the bottom sheet that has its own way of closing
  onClose?: () => void;
  onOpenAlbum: (albumId: number) => void;
}> = (props) => {
  const photos = usePhotos();

  let pendingDescription = props.detail.description;

  const saveDescription = async () => {
    if (pendingDescription.trim() === props.detail.description) return;

    try {
      await trpc.media.setDescription.mutate({ id: props.detail.id, description: pendingDescription });
      photos.refresh();
    } catch (error) {
      photos.notify(errorMessage(error));
    }
  };

  const dimensions = () => (props.detail.width > 0 && props.detail.height > 0 ? `${props.detail.width} × ${props.detail.height} · ` : "");

  return (
    <div class={styles.root}>
      <div class={styles.header}>
        <UKText role="title" size="l">
          Info
        </UKText>
        <Show when={props.onClose}>
          <UKIconButton color="standard" icon={CLOSE_ICON} alt="Close info" onClick={props.onClose!} />
        </Show>
      </div>

      {/* keyed: a different photo needs a field that starts from its own description */}
      <For each={[props.detail.id]}>
        {() => {
          pendingDescription = props.detail.description;

          return (
            <UKTextField
              color="outlined"
              as="textarea"
              label="Description"
              labelEmpty="Add a description"
              defaultValue={props.detail.description}
              maximumCharacterCount={2000}
              onValueChange={(value) => {
                pendingDescription = value;
              }}
              onBlur={() => void saveDescription()}
              labelBackgroundStyle="filled"
            />
          );
        }}
      </For>

      <div class={styles.rows}>
        <Row icon={CALENDAR_TODAY_ICON} title={viewerDay(props.detail.takenAt, true)} subtitle={clockTime(props.detail.takenAt)} />

        <Row
          icon={props.detail.kind === "video" ? PLAY_CIRCLE_ICON : IMAGE_ICON}
          title={props.detail.name}
          subtitle={`${dimensions()}${formatBytes(props.detail.size)}`}
        />

        <Show when={props.detail.camera || props.detail.exposure}>
          <Row icon={PHOTO_CAMERA_ICON} title={props.detail.camera ?? "Camera"} subtitle={props.detail.exposure ?? undefined} />
        </Show>

        <Row
          icon={LOCATION_ON_ICON}
          title={props.detail.location ?? "No location"}
          subtitle={props.detail.location ? "Edit location" : "Add or edit location"}
          onClick={props.detail.deleted ? undefined : () => photos.actions.editLocation([props.detail.id], props.detail.location)}
        />

        <Row icon={CLOUD_DONE_ICON} title="Stored on your server" subtitle="Original quality" />
      </div>

      <UKDivider direction="horizontal" />

      <div class={styles.albums}>
        <UKText role="title" size="m">
          In albums
        </UKText>
        <div class={styles.chips}>
          <For each={props.detail.albums}>
            {(album) => (
              <UKChip type="input" onClick={() => props.onOpenAlbum(album.id)}>
                {album.name}
              </UKChip>
            )}
          </For>
          <Show when={props.detail.favorite}>
            <UKChip type="input">Favorites</UKChip>
          </Show>
          <Show when={!props.detail.deleted}>
            <UKChip type="assist" leading={{ type: "icon", value: ADD_ICON }} onClick={() => photos.actions.addToAlbum([props.detail.id])}>
              Add
            </UKChip>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
