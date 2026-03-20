import { createFileUploader } from "@solid-primitives/upload";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import Cropper from "cropperjs";
import type { Component } from "solid-js";
import trpc from "../../../../../../lib/trpc.ts";
import styles from "./CropImage.module.scss";

const CropImage: Component<{ refetchAvatar(): void; close(): void }> = (props) => {
  const { selectFiles, files, clearFiles } = createFileUploader({
    accept: "image/*",
    multiple: false,
  });

  const cropperContainer: HTMLDivElement = (<div class={styles.cropper}></div>) as HTMLDivElement;

  let cropper: Cropper | undefined;

  selectFiles(() => {
    if (!files()?.[0]) return props.close();

    if (cropper) {
      cropper?.destroy();
    }

    const image = new Image();
    image.src = URL.createObjectURL(files()?.[0].file);
    cropper = new Cropper(image, {
      container: cropperContainer,
      template: `<cropper-canvas background>
  <cropper-image scalable translatable></cropper-image>
  <cropper-shade></cropper-shade>
  <cropper-selection aspectRatio="1" initialAspectRatio="1" initial-coverage="1" resizable>
    <cropper-grid role="grid" bordered covered></cropper-grid>
    <cropper-handle action="move" theme-color="rgb(var(--uk-sys-color-on-surface), 0.25)"></cropper-handle>
  </cropper-selection>
</cropper-canvas>`,
    });
  });

  return (
    <div class={styles.root}>
      {files().length === 0 ? (
        <div class={styles.spinnerContainer}>
          <UKIndeterminateSpinner />
        </div>
      ) : (
        <>
          {cropperContainer}
          <div class={styles.buttons}>
            <UKButton
              color="tonal"
              onClick={async () => {
                cropper?.destroy();
                clearFiles();
                props.close();
              }}
            >
              Cancel
            </UKButton>
            <UKButton
              affirmative
              color="filled"
              onClick={async () => {
                await new Promise<boolean>(async (resolve) => {
                  const canvas = await cropper?.getCropperSelection()?.$toCanvas();

                  if (canvas)
                    canvas.toBlob(async (c) => {
                      if (c) {
                        await trpc.profile.setProfilePicture.mutate(c);
                        setTimeout(() => {
                          cropper?.destroy();
                          clearFiles();
                          props.refetchAvatar();
                          props.close();
                        }, 1000);
                        resolve(true);
                      }
                    });
                });

                return () => {
                  window.location.reload();
                };
              }}
            >
              Confirm profile picture
            </UKButton>
          </div>
        </>
      )}
    </div>
  );
};

export default CropImage;
