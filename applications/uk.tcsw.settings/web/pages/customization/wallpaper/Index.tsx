import type { Component } from "solid-js";
import { createResource, createSignal, For } from "solid-js";
import ThemePreview from "../components/ThemePreview/ThemePreview.tsx";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import { useNavigate } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import styles from "./Index.module.scss";
import trpc from "../../../lib/trpc.ts";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import { createFileUploader } from "@solid-primitives/upload";

const WallpaperPage: Component = () => {
    const navigate = useNavigate();
    const { selectFiles: selectWallpaperUpload } = createFileUploader({ accept: "image/*", multiple: false });
    const [currentWallpaper, { refetch: refetchCurrentWallpaper, mutate: setCurrentWallpaper }] = createResource(() =>
        trpc.customization.wallpaper.currentWallpaper.query(),
    );
    const [previousWallpapers, { refetch: refetchWallpapers }] = createResource(() =>
        trpc.customization.wallpaper.wallpaperHistory.query(),
    );
    const [officialWallpapers, { refetch: refetchOfficialWallpapers }] = createResource(() => trpc.customization.wallpaper.officialWallpapers.query())

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
                <ThemePreview wallpaper={currentWallpaper()} />
                <UKButton
                    color={"filled"}
                    leadingIcon={"upload"}
                    onClick={() => {
                        selectWallpaperUpload(async ([{ file }]) => {

                            await trpc.customization.wallpaper.upload.mutate(file);
                        });
                    }}
                >
                    Upload Wallpaper
                </UKButton>
            </div>
            <UKDivider direction={DividerDirection.horizontal} />
            <div class={styles.wallpaperHistory}>
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
                                <div>
                                    wallpaper
                                    {wallpaper}
                                </div>
                            );
                        }}
                    </For>
                )}
            </div>
            <UKDivider direction={DividerDirection.horizontal} />
            <div class={styles.officialWallpapers}>
                {officialWallpapers()}
            </div>
        </div>
    );
};

export default WallpaperPage;
