import Cropper from "cropperjs";
import { type Component, createEffect } from "solid-js";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import { createFileUploader } from "@solid-primitives/upload";
import styles from "./CropImage.module.scss";
import trpc from "../../../../../../lib/trpc.ts";

const CropImage: Component<{ refetchAvatar(): void }> = (props) => {
    const { selectFiles, files, clearFiles } = createFileUploader({
        accept: "image/*",
        multiple: false,
    });

    const cropperContainer: HTMLDivElement = (<div class={styles.cropper}></div>) as HTMLDivElement;

    let cropper: Cropper | undefined;

    createEffect(() => {
        if (!files()?.[0]) return;

        if (cropper) {
            cropper?.destroy();
        }

        let image = new Image();
        image.src = URL.createObjectURL(files()?.[0].file);
        cropper = new Cropper(image, {
            container: cropperContainer,
            template: `<cropper-canvas background>
  <cropper-image scalable translatable></cropper-image>
  <cropper-shade></cropper-shade>
  <cropper-selection width="512" height="512" aspectRatio="1" initialAspectRatio="1" initial-coverage="0.5" movable resizable>
    <cropper-grid role="grid" bordered covered></cropper-grid>
    <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
  </cropper-selection>
</cropper-canvas>`,
        });
    });

    return (
        <div class={styles.root}>
            {cropperContainer}
            {files().length === 0 ? (
                <UKButton
                    class={styles.button}
                    color="filled"
                    onClick={() => {
                        selectFiles(async () => {
                            // await trpc.profile.setProfilePicture.mutate(file);
                        });
                    }}
                >
                    Upload new picture
                </UKButton>
            ) : (
                <div class={styles.buttons}>
                    <UKButton
                        color="tonal"
                        onClick={async () => {
                            clearFiles();
                            cropper?.destroy();
                        }}
                    >
                        Cancel
                    </UKButton>
                    <UKButton
                        color="filled"
                        onClick={async () => {
                            const canvas = await cropper?.getCropperSelection()?.$toCanvas();

                            if (canvas)
                                canvas.toBlob(async (c) => {
                                    if (c) {
                                        await trpc.profile.setProfilePicture.mutate(c);
                                        props.refetchAvatar();
                                        clearFiles();
                                        cropper?.destroy();
                                    }
                                });
                        }}
                    >
                        Confirm profile picture
                    </UKButton>
                </div>
            )}
        </div>
    );
};

export default CropImage;
