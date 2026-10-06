import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import IMAGE_ICON from "@material-symbols/svg-700/outlined/image.svg";
import REFRESH_ICON from "@material-symbols/svg-700/outlined/refresh.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import { createFileUploader } from "@solid-primitives/upload";
import { type Component, createResource, createSignal, type JSX, Show } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";
import styles from "./AssetCard.module.scss";

export type BrandingImageSegment = "loginBanner" | "loginBackground" | "favicon" | "squareLogo";

/**
 * One branding image: a live preview with its recommended size, an optional on/off switch and the upload actions.
 * Without a `segment` there is nothing to preview yet, so only the empty state is shown.
 */
const AssetCard: Component<{
  title: string;
  description: string;
  /** recommended pixel size, shown as a label and used for the placeholder's aspect ratio */
  size: { width: number; height: number };
  segment?: BrandingImageSegment;
  /** present when the image can be replaced; receives the chosen file */
  onUpload?: (file: File) => Promise<unknown>;
  /** extra settings for this image, shown under the preview */
  children?: JSX.Element;
  toggle?: { label: string; value: boolean; onChange: (value: boolean) => void | Promise<void> };
}> = (props) => {
  const [preview, { refetch }] = createResource(
    () => props.segment,
    (segment) => trpc.instance.branding[segment].preview.query(),
  );

  const [uploading, setUploading] = createSignal(false);
  const [error, setError] = createSignal<string>();
  const { selectFiles } = createFileUploader({ accept: "image/*", multiple: false });

  const upload = () =>
    selectFiles(async (files) => {
      const file = files[0]?.file;

      if (!file || !props.onUpload) return;

      setUploading(true);
      setError(undefined);

      try {
        await props.onUpload(file);
        await refetch();
      } catch (err) {
        setError(err instanceof Error ? err.message : "The image could not be uploaded");
      } finally {
        setUploading(false);
      }
    });

  const image = () => {
    const value = preview();

    return value?.exists ? value : undefined;
  };

  return (
    <UKCard class={styles.root}>
      <div class={styles.header}>
        <div class={styles.heading}>
          <UKText role="title" size="m">
            {props.title}
          </UKText>
          <UKText role="body" size="s" class={styles.description}>
            {props.description}
          </UKText>
        </div>
        <Show when={props.toggle}>
          {(toggle) => (
            <div class={styles.toggle}>
              <UKText role="label" size="m">
                {toggle().label}
              </UKText>
              <UKSwitch
                value={toggle().value}
                onValueChange={async (value) => {
                  setError(undefined);

                  try {
                    await toggle().onChange(value);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "The setting could not be changed");
                  }
                }}
              />
            </div>
          )}
        </Show>
      </div>
      <div class={styles.preview} style={{ "aspect-ratio": `${props.size.width} / ${props.size.height}` }} data-small={props.size.width <= 128}>
        <Show
          when={image()}
          fallback={
            <div class={styles.empty}>
              <UKIcon>{IMAGE_ICON}</UKIcon>
              <UKText role="label" size="m">
                {preview.loading ? "Loading preview…" : "No image set"}
              </UKText>
            </div>
          }
        >
          {(img) => <img alt="" class={styles.image} src={img().source} draggable={false} />}
        </Show>
      </div>
      {props.children}
      <div class={styles.footer}>
        <UKText role="label" size="m" class={styles.size}>
          Recommended {props.size.width} × {props.size.height}px
        </UKText>
        <div class={styles.actions}>
          <UKButton color="standard" leadingIcon={REFRESH_ICON} disabled={!props.segment} onClick={() => {
              refetch();
            }}>
            Refresh
          </UKButton>
          <UKButton color="tonal" leadingIcon={UPLOAD_ICON} disabled={!props.onUpload || uploading()} onClick={upload}>
            {uploading() ? "Uploading…" : "Upload"}
          </UKButton>
        </div>
      </div>
      <Show when={error()}>
        <UKText role="body" size="s" class={styles.error}>
          {error()}
        </UKText>
      </Show>
    </UKCard>
  );
};

export default AssetCard;
