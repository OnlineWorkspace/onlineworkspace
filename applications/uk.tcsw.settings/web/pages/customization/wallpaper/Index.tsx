import type { Component } from "solid-js";
import { createResource, For, Suspense } from "solid-js";
import ThemePreview from "../components/ThemePreview/ThemePreview.tsx";
import { useNavigate } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import styles from "./Index.module.scss";
import trpc from "../../../lib/trpc.ts";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import { createFileUploader } from "@solid-primitives/upload";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";

const WallpaperPage: Component = () => {
    const navigate = useNavigate();
    const { selectFiles: selectWallpaperUpload } = createFileUploader({ accept: "image/*", multiple: true });
    const [currentWallpaper, { refetch: refetchCurrentWallpaper }] = createResource(() =>
        trpc.customization.wallpaper.currentWallpaper.query(),
    );
    const [previousWallpapers, { refetch: refetchWallpapers }] = createResource(() =>
        trpc.customization.wallpaper.wallpaperHistory.query(),
    );
    const [officialWallpapers] = createResource(() => trpc.customization.wallpaper.officialWallpapers.query());

    return (
        <div>
            <UKButton
                class={styles.backButton}
                color={"tonal"}
                leadingIcon={"chevron_left"}
                onClick={() => {
                    navigate("/app/uk.tcsw.settings/customization");
                }}
            >
                Back
            </UKButton>
            <div class={styles.header}>
                <ThemePreview wallpaperOverride={currentWallpaper()} />
                <UKButton
                    color={"filled"}
                    leadingIcon={"upload"}
                    onClick={() => {
                        selectWallpaperUpload(async (files) => {
                            for (const file of files) {
                                let name = await trpc.customization.wallpaper.upload.mutate(file.file);
                                await refetchWallpapers();

                                if (files.length === 1) {
                                    await trpc.customization.wallpaper.setWallpaper.mutate({
                                        name: name,
                                    });
                                    await refetchCurrentWallpaper();
                                }
                            }
                        });
                    }}
                >
                    Upload Wallpaper
                </UKButton>
            </div>
            <UKDivider direction={DividerDirection.horizontal} />
            <UKText role={"title"} size={"m"} class={styles.sectionHeading}>
                Previous Wallpapers
            </UKText>
            <div class={styles.wallpaperHistory}>
                <Suspense fallback={<UKIndeterminateSpinner />}>
                    {previousWallpapers()?.length === 0 ? (
                        <div class={styles.noWallpapersMessage}>
                            <UKText role={"title"} size={"l"} align={"center"}>
                                No Wallpapers
                            </UKText>
                            <UKText role={"body"} size={"l"} align={"center"}>
                                You have no previous wallpapers, please upload a wallpaper to see it here
                            </UKText>
                        </div>
                    ) : (
                        <For each={previousWallpapers() || []}>
                            {(wallpaper) => {
                                return (
                                    <div
                                        class={styles.wallpaper}
                                        onClick={async () => {
                                            await trpc.customization.wallpaper.setWallpaper.mutate({ name: wallpaper.name });
                                            refetchCurrentWallpaper();
                                        }}
                                    >
                                        <UKIconButton
                                            size={"xs"}
                                            class={styles.deleteWallpaper}
                                            icon={"delete"}
                                            color={"tonal"}
                                            onClick={async () => {
                                                await trpc.customization.wallpaper.delete.mutate({ name: wallpaper.name });
                                                refetchWallpapers();
                                            }}
                                            alt={"delete"}
                                        />
                                        <img src={wallpaper.previewSrc} loading={"lazy"} alt={"wallpaper preview"} />
                                    </div>
                                );
                            }}
                        </For>
                    )}
                </Suspense>
            </div>
            <UKDivider direction={DividerDirection.horizontal} />
            <UKText role={"title"} size={"m"} class={styles.sectionHeading}>
                Official Wallpapers
            </UKText>
            <div class={styles.officialWallpapers}>
                <For each={officialWallpapers() || []}>
                    {(wallpaper) => {
                        return (
                            <div
                                class={styles.wallpaper}
                                onClick={async () => {
                                    await trpc.customization.wallpaper.setOfficialWallpaper.mutate({ name: wallpaper.name });

                                    refetchCurrentWallpaper()
                                }}
                            >
                                <img src={wallpaper.previewSrc} loading={"lazy"} alt={"wallpaper preview"} />
                            </div>
                        );
                    }}
                </For>
            </div>
        </div>
    );
};

export default WallpaperPage;
