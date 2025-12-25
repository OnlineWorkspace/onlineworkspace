import type { Component } from "solid-js";
import { createEffect, createResource, createSignal, For, onMount, Suspense } from "solid-js";
import ThemePreview from "../components/ThemePreview/ThemePreview.tsx";
import { useNavigate } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import styles from "./Index.module.scss";
import trpc from "../../../lib/trpc.ts";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import { createFileUploader } from "@solid-primitives/upload";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import UKButtonGroup from "@tcsw/uikit-solid/src/components/buttonGroup/UKButtonGroup.jsx";

const WallpaperPage: Component = () => {
    const navigate = useNavigate();
    const { selectFiles: selectWallpaperUpload } = createFileUploader({
        accept: "image/*",
        multiple: true,
    });
    const [currentWallpaper, { refetch: refetchCurrentWallpaper }] = createResource(() =>
        trpc.customization.wallpaper.currentWallpaper.query(),
    );
    const [previousWallpapers, { refetch: refetchWallpapers }] = createResource(() =>
        trpc.customization.wallpaper.wallpaperHistory.query(),
    );
    const [officialWallpapers] = createResource(() =>
        trpc.customization.wallpaper.officialWallpapers.query(),
    );
    const [wallpaperAlignHorizontal, setWallpaperAlignHorizontal] = createSignal<
        "left" | "center" | "right" | undefined
    >(undefined);
    const [wallpaperAlignVertical, setWallpaperAlignVertical] = createSignal<
        "top" | "middle" | "bottom" | undefined
    >(undefined);
    const [wallpaperFit, setWallpaperFit] = createSignal<"fill" | "cover" | "contain" | undefined>(
        undefined,
    );

    onMount(async () => {
        const options = await trpc.customization.wallpaper.getOptions.query();

        if (options.position === "center") {
            setWallpaperAlignHorizontal("center");
            setWallpaperAlignVertical("middle");
            // @ts-ignore
            setWallpaperFit(options.fit);

            return;
        }

        // @ts-ignore
        let positionSegments: ["left" | "center" | "right", "top" | "middle" | "bottom"] =
            options.position.split(" ");

        setWallpaperAlignHorizontal(positionSegments[0]);
        setWallpaperAlignVertical(positionSegments[1]);
        // @ts-ignore
        setWallpaperFit(options.fit);
    });

    createEffect(async () => {
        let position = "center";

        if (wallpaperAlignHorizontal() === "center" && wallpaperAlignVertical() === "middle") {
            position = "center";
        } else {
            if (wallpaperAlignHorizontal() === "left") position = "left";

            if (wallpaperAlignHorizontal() === "right") position = "right";

            if (position === "middle") {
                if (wallpaperAlignVertical() === "top") position = "top";

                if (wallpaperAlignVertical() === "bottom") position = "bottom";
            } else {
                if (wallpaperAlignVertical() === "top") position += " top";

                if (wallpaperAlignVertical() === "bottom") position += " bottom";
            }
        }

        await trpc.customization.wallpaper.setOptions.mutate({
            fit: wallpaperFit() || "cover",
            position: position,
            background: "#333",
        });

        refetchCurrentWallpaper();
    });

    return (
        <>
            <UKTopAppBar
                type={"small"}
                headline={"Manage Wallpaper"}
                leadingButton={{
                    accessibleLabel: "Back",
                    icon: "chevron_left",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/customization");
                    },
                }}
            />
            <div class={styles.root}>
                <div class={styles.header}>
                    <ThemePreview
                        wallpaperOverride={currentWallpaper()}
                        align={[
                            wallpaperAlignHorizontal() || "center",
                            wallpaperAlignVertical() || "middle",
                        ]}
                        fillStyle={wallpaperFit()}
                    />
                </div>

                <UKText role={"title"} size={"m"} class={styles.subheading}>
                    Wallpaper Fit
                </UKText>
                <div class={styles.configureWallpaper}>
                    <UKButtonGroup size={"s"} connected={true}>
                        <UKButton
                            leadingIcon={wallpaperFit() === "fill" ? "check" : undefined}
                            onClick={() => {
                                setWallpaperFit("fill");
                            }}
                            color={wallpaperFit() === "fill" ? "filled" : "tonal"}
                        >
                            Fill
                        </UKButton>
                        <UKButton
                            leadingIcon={wallpaperFit() === "cover" ? "check" : undefined}
                            onClick={() => {
                                setWallpaperFit("cover");
                            }}
                            color={wallpaperFit() === "cover" ? "filled" : "tonal"}
                        >
                            Cover
                        </UKButton>
                        <UKButton
                            leadingIcon={wallpaperFit() === "contain" ? "check" : undefined}
                            onClick={() => {
                                setWallpaperFit("contain");
                            }}
                            color={wallpaperFit() === "contain" ? "filled" : "tonal"}
                        >
                            Contain
                        </UKButton>
                    </UKButtonGroup>
                </div>

                <UKText role={"title"} size={"m"} class={styles.subheading}>
                    Wallpaper Alignment
                </UKText>
                <div class={styles.configureWallpaper}>
                    <UKButtonGroup size={"s"} connected={true}>
                        <UKButton
                            disabled={wallpaperFit() === "fill"}
                            leadingIcon={wallpaperAlignVertical() === "top" ? "check" : undefined}
                            onClick={() => {
                                setWallpaperAlignVertical("top");
                            }}
                            color={wallpaperAlignVertical() === "top" ? "filled" : "tonal"}
                        >
                            Top
                        </UKButton>
                        <UKButton
                            disabled={wallpaperFit() === "fill"}
                            leadingIcon={
                                wallpaperAlignVertical() === "middle" ? "check" : undefined
                            }
                            onClick={() => {
                                setWallpaperAlignVertical("middle");
                            }}
                            color={wallpaperAlignVertical() === "middle" ? "filled" : "tonal"}
                        >
                            Middle
                        </UKButton>
                        <UKButton
                            disabled={wallpaperFit() === "fill"}
                            leadingIcon={
                                wallpaperAlignVertical() === "bottom" ? "check" : undefined
                            }
                            onClick={() => {
                                setWallpaperAlignVertical("bottom");
                            }}
                            color={wallpaperAlignVertical() === "bottom" ? "filled" : "tonal"}
                        >
                            Bottom
                        </UKButton>
                    </UKButtonGroup>
                    <UKButtonGroup size={"s"} connected={true}>
                        <UKButton
                            disabled={wallpaperFit() === "fill"}
                            leadingIcon={
                                wallpaperAlignHorizontal() === "left" ? "check" : undefined
                            }
                            onClick={() => {
                                setWallpaperAlignHorizontal("left");
                            }}
                            color={wallpaperAlignHorizontal() === "left" ? "filled" : "tonal"}
                        >
                            Left
                        </UKButton>
                        <UKButton
                            disabled={wallpaperFit() === "fill"}
                            leadingIcon={
                                wallpaperAlignHorizontal() === "center" ? "check" : undefined
                            }
                            onClick={() => {
                                setWallpaperAlignHorizontal("center");
                            }}
                            color={wallpaperAlignHorizontal() === "center" ? "filled" : "tonal"}
                        >
                            Center
                        </UKButton>
                        <UKButton
                            disabled={wallpaperFit() === "fill"}
                            leadingIcon={
                                wallpaperAlignHorizontal() === "right" ? "check" : undefined
                            }
                            onClick={() => {
                                setWallpaperAlignHorizontal("right");
                            }}
                            color={wallpaperAlignHorizontal() === "right" ? "filled" : "tonal"}
                        >
                            Right
                        </UKButton>
                    </UKButtonGroup>
                </div>

                <UKText role={"title"} size={"m"} class={styles.subheading}>
                    Select New Wallpaper
                </UKText>
                <div class={styles.selectWallpaper}>
                    <UKButton
                        color={"filled"}
                        leadingIcon={"upload"}
                        onClick={() => {
                            selectWallpaperUpload(async (files) => {
                                for (const file of files) {
                                    let name = await trpc.customization.wallpaper.upload.mutate(
                                        file.file,
                                    );
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
                    <UKButton
                        disabled={true}
                        color={"tonal"}
                        leadingIcon={"folder"}
                        onClick={() => {
                            return 0;
                        }}
                    >
                        Choose from Files
                    </UKButton>
                </div>

                <UKText role={"title"} size={"m"} class={styles.subheading}>
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
                                    You have no previous wallpapers, please upload a wallpaper to
                                    see it here
                                </UKText>
                            </div>
                        ) : (
                            <For each={previousWallpapers() || []}>
                                {(wallpaper) => {
                                    return (
                                        <div
                                            class={styles.wallpaper}
                                            onClick={async () => {
                                                await trpc.customization.wallpaper.setWallpaper.mutate(
                                                    {
                                                        name: wallpaper.name,
                                                    },
                                                );
                                                refetchCurrentWallpaper();
                                            }}
                                        >
                                            <UKIconButton
                                                size={"xs"}
                                                class={styles.deleteWallpaper}
                                                icon={"delete"}
                                                color={"tonal"}
                                                onClick={async () => {
                                                    await trpc.customization.wallpaper.delete.mutate(
                                                        {
                                                            name: wallpaper.name,
                                                        },
                                                    );
                                                    refetchWallpapers();
                                                }}
                                                alt={"delete"}
                                            />
                                            <img
                                                src={wallpaper.previewSrc}
                                                loading={"lazy"}
                                                alt={"wallpaper preview"}
                                            />
                                        </div>
                                    );
                                }}
                            </For>
                        )}
                    </Suspense>
                </div>

                <UKText role={"title"} size={"m"} class={styles.subheading}>
                    Official Wallpapers
                </UKText>
                <div class={styles.officialWallpapers}>
                    <For each={officialWallpapers() || []}>
                        {(wallpaper) => {
                            return (
                                <div
                                    class={styles.wallpaper}
                                    onClick={async () => {
                                        await trpc.customization.wallpaper.setOfficialWallpaper.mutate(
                                            {
                                                name: wallpaper.name,
                                            },
                                        );

                                        refetchCurrentWallpaper();
                                    }}
                                >
                                    <img
                                        src={wallpaper.previewSrc}
                                        loading={"lazy"}
                                        alt={"wallpaper preview"}
                                    />
                                </div>
                            );
                        }}
                    </For>
                </div>
            </div>
        </>
    );
};

export default WallpaperPage;
