import {type Component, createResource, Show, Suspense} from "solid-js";
import styles from "./ImageUploadAndPreview.module.scss"
import trpc from "../../../../../lib/trpc.ts";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import REFRESH_ICON from "@material-symbols/svg-700/outlined/refresh.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";

const ImageUploadAndPreview: Component<{ trpcSegment: "loginBanner" | "loginBackground" | "favicon" | "squareLogo" }> = (props) => {
  const [previewImage] = createResource(() =>
    trpc.instance.branding[props.trpcSegment].preview.query()
  );

  return (
    <div class={styles.expandedContent}>
      <Suspense>
        <Show when={previewImage()?.exists === true} fallback={<>Does not exist</>}>
        <img
          alt={""}
          class={styles.image}
          style={{
            "aspect-ratio": (previewImage() as { dimensions: { width: number } })!.dimensions.width + " / " + (previewImage() as { dimensions: { height: number } })!.dimensions.height,
            "max-height": Math.min((previewImage() as { dimensions: { height: number } })!.dimensions.height, 256) + "px"
          }}
          src={(previewImage() as { source: string })!.source || ""}
        />
        </Show>
      </Suspense>
      <UKButtonGroup size={"s"} align="end">
        <UKButton
          leadingIcon={REFRESH_ICON}
          onClick={() => {}}
          color="standard"
        >
          Refresh
        </UKButton>
        <UKButton
          leadingIcon={UPLOAD_ICON}
          onClick={() => {}}
          color="filled"
        >
          Upload New
        </UKButton>
      </UKButtonGroup>
    </div>
  );
}

export default ImageUploadAndPreview;
