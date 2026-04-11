import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import FOLDER_ICON from "@material-symbols/svg-700/outlined/folder.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import UKButton from "@onlineworkspace/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@onlineworkspace/uikit-solid/src/components/buttonGroup/UKButtonGroup.jsx";
import { DividerDirection } from "@onlineworkspace/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.jsx";
import UKIconButton from "@onlineworkspace/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKIndeterminateSpinner from "@onlineworkspace/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";
import UKStack from "@onlineworkspace/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@onlineworkspace/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKStackLabel from "@onlineworkspace/uikit-solid/src/components/stack/UKStackLabel.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@onlineworkspace/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { createFileUploader } from "@solid-primitives/upload";
import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";
import { createEffect, createResource, createSignal, For, onMount, Suspense } from "solid-js";
import trpc from "../../../lib/trpc.ts";
import ThemePreview from "../components/ThemePreview/ThemePreview.tsx";
import styles from "./Index.module.scss";

const WallpaperPage: Component = () => {
  const navigate = useNavigate();
  const { selectFiles: selectWallpaperUpload } = createFileUploader({
    accept: "image/*",
    multiple: true,
  });
  const [currentWallpaper, { refetch: refetchCurrentWallpaper }] = createResource(() => trpc.customization.wallpaper.getCurrentWallpaper.query());
  const [previousWallpapers, { refetch: refetchWallpapers }] = createResource(() => trpc.customization.wallpaper.wallpaperHistory.query());
  const [officialWallpapers] = createResource(() => trpc.customization.wallpaper.getDefaultWallpapers.query());
  const [wallpaperAlignHorizontal, setWallpaperAlignHorizontal] = createSignal<"left" | "center" | "right" | undefined>(undefined);
  const [wallpaperAlignVertical, setWallpaperAlignVertical] = createSignal<"top" | "middle" | "bottom" | undefined>(undefined);
  const [wallpaperFit, setWallpaperFit] = createSignal<"fill" | "cover" | "contain" | undefined>(undefined);

  onMount(async () => {
    const options = await trpc.customization.wallpaper.getOptions.query();

    if (options.position.length === 1 && options.position[0] === "center") {
      setWallpaperAlignHorizontal("center");
      setWallpaperAlignVertical("middle");
      // @ts-ignore
      setWallpaperFit(options.fit);

      return;
    }

    // @ts-ignore
    const positionSegments: ["left" | "center" | "right", "top" | "middle" | "bottom"] = options;

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

      if (position === "center") {
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
      background: "#0000",
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
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings/customization");
          },
        }}
      />
      <div class={styles.root}>
        <div class={styles.header}>
          <ThemePreview
            wallpaperOverride={currentWallpaper()}
            align={[wallpaperAlignHorizontal() || "center", wallpaperAlignVertical() || "middle"]}
            fillStyle={wallpaperFit()}
          />
          <UKDivider direction={DividerDirection.horizontal} width={"middle-inset"} />
        </div>

        <UKStackLabel>Wallpaper Options</UKStackLabel>
        <UKStack>
          <UKStackItem
            labelText="Wallpaper Size"
            inlineComponent={
              <UKButtonGroup size={"s"} connected={true} align="end">
                <UKButton
                  leadingIcon={wallpaperFit() === "fill" ? CHECK_ICON : undefined}
                  onClick={() => {
                    setWallpaperFit("fill");
                  }}
                  color={wallpaperFit() === "fill" ? "filled" : "tonal"}
                >
                  Fill
                </UKButton>
                <UKButton
                  leadingIcon={wallpaperFit() === "cover" ? CHECK_ICON : undefined}
                  onClick={() => {
                    setWallpaperFit("cover");
                  }}
                  color={wallpaperFit() === "cover" ? "filled" : "tonal"}
                >
                  Cover
                </UKButton>
                <UKButton
                  leadingIcon={wallpaperFit() === "contain" ? CHECK_ICON : undefined}
                  onClick={() => {
                    setWallpaperFit("contain");
                  }}
                  color={wallpaperFit() === "contain" ? "filled" : "tonal"}
                >
                  Contain
                </UKButton>
              </UKButtonGroup>
            }
          />
          {wallpaperFit() !== "fill" && (
            <>
              <UKStackItem
                labelText="Wallpaper Vertical Alignment"
                inlineComponent={
                  <UKButtonGroup size={"s"} connected={true} align="end">
                    <UKButton
                      leadingIcon={wallpaperAlignVertical() === "top" ? CHECK_ICON : undefined}
                      onClick={() => {
                        setWallpaperAlignVertical("top");
                      }}
                      color={wallpaperAlignVertical() === "top" ? "filled" : "tonal"}
                    >
                      Top
                    </UKButton>
                    <UKButton
                      leadingIcon={wallpaperAlignVertical() === "middle" ? CHECK_ICON : undefined}
                      onClick={() => {
                        setWallpaperAlignVertical("middle");
                      }}
                      color={wallpaperAlignVertical() === "middle" ? "filled" : "tonal"}
                    >
                      Middle
                    </UKButton>
                    <UKButton
                      leadingIcon={wallpaperAlignVertical() === "bottom" ? CHECK_ICON : undefined}
                      onClick={() => {
                        setWallpaperAlignVertical("bottom");
                      }}
                      color={wallpaperAlignVertical() === "bottom" ? "filled" : "tonal"}
                    >
                      Bottom
                    </UKButton>
                  </UKButtonGroup>
                }
              />
              <UKStackItem
                labelText="Wallpaper Vertical Alignment"
                inlineComponent={
                  <UKButtonGroup size={"s"} connected={true} align="end">
                    <UKButton
                      leadingIcon={wallpaperAlignHorizontal() === "left" ? CHECK_ICON : undefined}
                      onClick={() => {
                        setWallpaperAlignHorizontal("left");
                      }}
                      color={wallpaperAlignHorizontal() === "left" ? "filled" : "tonal"}
                    >
                      Left
                    </UKButton>
                    <UKButton
                      leadingIcon={wallpaperAlignHorizontal() === "center" ? CHECK_ICON : undefined}
                      onClick={() => {
                        setWallpaperAlignHorizontal("center");
                      }}
                      color={wallpaperAlignHorizontal() === "center" ? "filled" : "tonal"}
                    >
                      Center
                    </UKButton>
                    <UKButton
                      leadingIcon={wallpaperAlignHorizontal() === "right" ? CHECK_ICON : undefined}
                      onClick={() => {
                        setWallpaperAlignHorizontal("right");
                      }}
                      color={wallpaperAlignHorizontal() === "right" ? "filled" : "tonal"}
                    >
                      Right
                    </UKButton>
                  </UKButtonGroup>
                }
              />
            </>
          )}
        </UKStack>
        <UKText role={"title"} size={"m"} class={styles.subheading}>
          Select New Wallpaper
        </UKText>
        <div class={styles.selectWallpaper}>
          <UKButton
            color={"filled"}
            leadingIcon={UPLOAD_ICON}
            onClick={() => {
              selectWallpaperUpload(async (files) => {
                for (const file of files) {
                  const name = await trpc.customization.wallpaper.upload.mutate(file.file);
                  await refetchWallpapers();

                  if (files.length === 1) {
                    await trpc.customization.wallpaper.setWallpaperToCustomWallpaper.mutate({
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
            leadingIcon={FOLDER_ICON}
            onClick={() => {
              return 0;
            }}
          >
            Choose from Files
          </UKButton>
        </div>

        {previousWallpapers()?.length !== 0 ? (
          <>
            <UKText role={"title"} size={"m"} class={styles.subheading}>
              Previous Wallpapers
            </UKText>
            <div class={styles.wallpaperHistory}>
              <Suspense fallback={<UKIndeterminateSpinner />}>
                <For each={previousWallpapers() || []}>
                  {(wallpaper) => {
                    return (
                      <button
                        type="button"
                        class={styles.wallpaper}
                        onClick={async () => {
                          await trpc.customization.wallpaper.setWallpaperToCustomWallpaper.mutate({
                            name: wallpaper.name,
                          });
                          refetchCurrentWallpaper();
                        }}
                      >
                        <UKIconButton
                          size={"xs"}
                          class={styles.deleteWallpaper}
                          icon={DELETE_ICON}
                          color={"tonal"}
                          onClick={async () => {
                            await trpc.customization.wallpaper.delete.mutate({
                              name: wallpaper.name,
                            });
                            refetchWallpapers();
                          }}
                          alt={"delete"}
                        />
                        <img src={wallpaper.previewSrc} loading={"lazy"} alt={"wallpaper preview"} />
                      </button>
                    );
                  }}
                </For>
              </Suspense>
            </div>
          </>
        ) : null}

        <UKText role={"title"} size={"m"} class={styles.subheading}>
          Official Wallpapers
        </UKText>
        <div class={styles.officialWallpapers}>
          <For each={officialWallpapers() || []}>
            {(wallpaper) => {
              return (
                <button
                  type="button"
                  class={styles.wallpaper}
                  onClick={async () => {
                    await trpc.customization.wallpaper.setWallpaperToDefaultWallpaper.mutate({
                      name: wallpaper.name,
                    });

                    refetchCurrentWallpaper();
                  }}
                >
                  <img src={wallpaper.previewSrc} loading={"lazy"} alt={"wallpaper preview"} />
                </button>
              );
            }}
          </For>
        </div>
      </div>
    </>
  );
};

export default WallpaperPage;
