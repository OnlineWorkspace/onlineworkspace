import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import { createFileUploader } from "@solid-primitives/upload";
import { useNavigate } from "@solidjs/router";
import type { Component, JSX } from "solid-js";
import { createEffect, createResource, createSignal, For, on, onCleanup, Show, Suspense } from "solid-js";
import trpc from "../../../lib/trpc.ts";
import { previewWallpaperDimensions } from "../../../lib/wallpaperPreview.ts";
import ThemePreview from "../components/ThemePreview/ThemePreview.tsx";
import styles from "./Index.module.scss";

type Horizontal = "left" | "center" | "right";
type Vertical = "top" | "middle" | "bottom";
type Fit = "fill" | "inside";
type Wallpaper = { name: string; previewSrc: string };

const SAVE_DEBOUNCE_MS = 400;

/** converts the stored position string (e.g. "left top", "top", "center") into [horizontal, vertical] */
function parsePosition(segments: string[]): [Horizontal, Vertical] {
  let horizontal: Horizontal = "center";
  let vertical: Vertical = "middle";

  for (const segment of segments) {
    if (segment === "left" || segment === "right") horizontal = segment;
    if (segment === "top" || segment === "bottom") vertical = segment;
  }

  return [horizontal, vertical];
}

function serialisePosition(horizontal: Horizontal, vertical: Vertical): string {
  const segments = [horizontal !== "center" ? horizontal : undefined, vertical !== "middle" ? vertical : undefined].filter(Boolean);

  return segments.length === 0 ? "center" : segments.join(" ");
}

function Choice<T extends string>(props: { label: string; value: T | undefined; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <UKStackItem
      labelText={props.label}
      inlineComponent={
        <UKButtonGroup size={"s"} connected={true} align="end">
          <For each={props.options}>
            {(option) => (
              <UKButton
                leadingIcon={props.value === option.value ? CHECK_ICON : undefined}
                onClick={() => props.onChange(option.value)}
                color={props.value === option.value ? "filled" : "tonal"}
              >
                {option.label}
              </UKButton>
            )}
          </For>
        </UKButtonGroup>
      }
    />
  );
}

const WallpaperTile: Component<{
  wallpaper: Wallpaper;
  busy: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  children?: JSX.Element;
}> = (props) => (
  <div class={styles.wallpaper} data-busy={props.busy}>
    <button type="button" class={styles.wallpaperSelect} disabled={props.busy} onClick={props.onSelect} aria-label="Use this wallpaper">
      <img src={props.wallpaper.previewSrc} draggable={false} loading={"lazy"} alt={"wallpaper preview"} />
    </button>
    <Show when={props.busy}>
      <div class={styles.wallpaperBusy}>
        <UKCircularProgressIndicator />
      </div>
    </Show>
    <Show when={props.onDelete}>
      <UKIconButton size={"xs"} class={styles.deleteWallpaper} icon={DELETE_ICON} color={"tonal"} onClick={() => props.onDelete?.()} alt={"delete wallpaper"} />
    </Show>
  </div>
);

const WallpaperPage: Component = () => {
  const navigate = useNavigate();
  const { selectFiles: selectWallpaperUpload } = createFileUploader({
    accept: "image/*",
    multiple: true,
  });
  const [currentWallpaper, { refetch: refetchCurrentWallpaper }] = createResource(() => trpc.customization.wallpaper.getCurrentWallpaper.query(previewWallpaperDimensions()));
  const [previousWallpapers, { refetch: refetchWallpapers }] = createResource(() => trpc.customization.wallpaper.wallpaperHistory.query());
  const [officialWallpapers] = createResource(() => trpc.customization.wallpaper.getDefaultWallpapers.query());
  const [savedOptions] = createResource(() => trpc.customization.wallpaper.getOptions.query());

  const [alignHorizontal, setAlignHorizontal] = createSignal<Horizontal>("center");
  const [alignVertical, setAlignVertical] = createSignal<Vertical>("middle");
  const [fit, setFit] = createSignal<Fit>("inside");
  // the fit the server is using, which is what the dashboard shows
  const [appliedFit, setAppliedFit] = createSignal<Fit | undefined>(undefined);
  const [saveState, setSaveState] = createSignal<"idle" | "saving" | "saved" | "error">("idle");
  const [applyingWallpaper, setApplyingWallpaper] = createSignal<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = createSignal<{ done: number; total: number } | undefined>(undefined);
  const [errorMessage, setErrorMessage] = createSignal<string | undefined>(undefined);
  const [dragging, setDragging] = createSignal(false);
  const [wallpaperToDelete, setWallpaperToDelete] = createSignal<Wallpaper | undefined>(undefined);

  // the key of the options last known to be on the server, so we only save real changes
  let lastSyncedKey: string | undefined;
  const optionsKey = () => `${fit()}|${serialisePosition(alignHorizontal(), alignVertical())}`;

  createEffect(() => {
    const options = savedOptions();

    if (!options) return;

    const [horizontal, vertical] = parsePosition(options.position);

    setAlignHorizontal(horizontal);
    setAlignVertical(vertical);
    setFit(options.fit === "fill" ? "fill" : "inside");
    setAppliedFit(options.fit === "fill" ? "fill" : "inside");
    lastSyncedKey = optionsKey();
  });

  // save option changes after a short pause, so rapid clicks only cause one save
  createEffect(
    on(optionsKey, (key) => {
      if (savedOptions() === undefined || key === lastSyncedKey) return;

      const timer = setTimeout(async () => {
        setSaveState("saving");

        try {
          await trpc.customization.wallpaper.setOptions.mutate({
            fit: fit(),
            position: serialisePosition(alignHorizontal(), alignVertical()),
            background: "#0000",
          });
          lastSyncedKey = key;
          setAppliedFit(fit());
          setSaveState("saved");
          await refetchCurrentWallpaper();
        } catch {
          setSaveState("error");
        }
      }, SAVE_DEBOUNCE_MS);

      onCleanup(() => clearTimeout(timer));
    }),
  );

  const uploadFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));

    if (images.length === 0) {
      setErrorMessage("Only image files can be used as wallpapers.");

      return;
    }

    setErrorMessage(undefined);
    let failed = 0;

    for (const [index, file] of images.entries()) {
      setUploadProgress({ done: index, total: images.length });

      try {
        await trpc.customization.wallpaper.upload.mutate(file);
      } catch {
        failed++;
      }
    }

    setUploadProgress(undefined);
    if (failed > 0) setErrorMessage(`${failed} of ${images.length} wallpapers failed to upload.`);
    // the newest upload becomes the current wallpaper
    await Promise.all([refetchWallpapers(), refetchCurrentWallpaper()]);
  };

  const applyWallpaper = async (key: string, apply: () => Promise<unknown>) => {
    setApplyingWallpaper(key);
    setErrorMessage(undefined);

    try {
      await apply();
      // the history hides the current wallpaper, so it changes along with it
      await Promise.all([refetchCurrentWallpaper(), refetchWallpapers()]);
    } catch {
      setErrorMessage("Couldn't change your wallpaper, please try again.");
    } finally {
      setApplyingWallpaper(undefined);
    }
  };

  const saveStatusText = () => {
    switch (saveState()) {
      case "saving":
        return "Saving…";
      case "saved":
        return "All changes saved";
      case "error":
        return "Couldn't save your changes";
      default:
        return "";
    }
  };

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
      <div
        class={styles.root}
        data-dragging={dragging()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles([...(e.dataTransfer?.files ?? [])]);
        }}
      >
        <div class={styles.header}>
          <ThemePreview wallpaperOverride={currentWallpaper()} fit={appliedFit()} />
          <UKText role={"label"} size={"s"} class={styles.status} data-visible={saveState() !== "idle"} data-error={saveState() === "error"}>
            {saveStatusText()}
          </UKText>
          <UKDivider direction={DividerDirection.horizontal} width={"middle-inset"} />
        </div>

        <UKStackLabel>Wallpaper Options</UKStackLabel>
        <UKStack>
          <Choice
            label="Wallpaper Size"
            value={fit()}
            onChange={setFit}
            options={[
              { value: "fill", label: "Fill" },
              { value: "inside", label: "Inside" },
            ]}
          />
          <Show when={fit() !== "fill"}>
            <Choice
              label="Wallpaper Vertical Alignment"
              value={alignVertical()}
              onChange={setAlignVertical}
              options={[
                { value: "top", label: "Top" },
                { value: "middle", label: "Middle" },
                { value: "bottom", label: "Bottom" },
              ]}
            />
            <Choice
              label="Wallpaper Horizontal Alignment"
              value={alignHorizontal()}
              onChange={setAlignHorizontal}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
            />
          </Show>
        </UKStack>

        <UKStackLabel>Select New Wallpaper</UKStackLabel>
        <div class={styles.dropzone} data-active={dragging()} data-uploading={uploadProgress() !== undefined}>
          <div class={styles.dropzoneIcon}>
            <UKIcon>{UPLOAD_ICON}</UKIcon>
          </div>
          <div class={styles.dropzoneText}>
            <UKText role={"title"} size={"s"}>
              {dragging() ? "Drop to upload" : "Add your own wallpaper"}
            </UKText>
            <UKText role={"body"} size={"s"} class={styles.hint}>
              Drag and drop images anywhere on this page, or browse your device
            </UKText>
          </div>
          <UKButton
            color={"filled"}
            leadingIcon={UPLOAD_ICON}
            disabled={uploadProgress() !== undefined}
            onClick={() => selectWallpaperUpload((files) => uploadFiles(files.map((f) => f.file)))}
          >
            {uploadProgress() ? `Uploading ${uploadProgress()!.done + 1} of ${uploadProgress()!.total}…` : "Upload"}
          </UKButton>
        </div>
        <Show when={errorMessage()}>
          <UKText role={"body"} size={"m"} class={styles.error}>
            {errorMessage()}
          </UKText>
        </Show>

        <UKStackLabel>Previous Wallpapers</UKStackLabel>
        <Suspense
          fallback={
            <div class={styles.wallpaperGrid}>
              <For each={[1, 2, 3, 4]}>{() => <div class={styles.skeleton} />}</For>
            </div>
          }
        >
          <Show
            when={(previousWallpapers() ?? []).length > 0}
            fallback={
              <UKText role={"body"} size={"m"} class={styles.hint}>
                Wallpapers you upload will show up here.
              </UKText>
            }
          >
            <div class={styles.wallpaperGrid}>
              <For each={previousWallpapers() ?? []}>
                {(wallpaper) => (
                  <WallpaperTile
                    wallpaper={wallpaper}
                    busy={applyingWallpaper() === `custom:${wallpaper.name}`}
                    onSelect={() =>
                      applyWallpaper(`custom:${wallpaper.name}`, () => trpc.customization.wallpaper.setWallpaperToCustomWallpaper.mutate({ name: wallpaper.name }))
                    }
                    onDelete={() => setWallpaperToDelete(wallpaper)}
                  />
                )}
              </For>
            </div>
          </Show>
        </Suspense>

        <UKStackLabel>Official Wallpapers</UKStackLabel>
        <div class={styles.wallpaperGrid}>
          <For each={officialWallpapers() ?? []}>
            {(wallpaper) => (
              <WallpaperTile
                wallpaper={wallpaper}
                busy={applyingWallpaper() === `default:${wallpaper.name}`}
                onSelect={() =>
                  applyWallpaper(`default:${wallpaper.name}`, () => trpc.customization.wallpaper.setWallpaperToDefaultWallpaper.mutate({ name: wallpaper.name }))
                }
              />
            )}
          </For>
        </div>
      </div>

      <UKDialog show={() => wallpaperToDelete() !== undefined} onClose={() => setWallpaperToDelete(undefined)}>
        <UKText role="title" size="l">
          Delete Wallpaper
        </UKText>
        <UKDivider direction="horizontal" />
        <Show when={wallpaperToDelete()}>{(w) => <img class={styles.deletePreview} src={w().previewSrc} alt="wallpaper to delete" />}</Show>
        <UKText role="body" size="m">
          Are you sure you want to delete this wallpaper? This can't be undone.
        </UKText>
        <UKButtonGroup size={"s"} align={"end"}>
          <UKButton
            color={"tonal"}
            onClick={async () => {
              const wallpaper = wallpaperToDelete();

              setWallpaperToDelete(undefined);
              if (!wallpaper) return;

              try {
                await trpc.customization.wallpaper.delete.mutate({ name: wallpaper.name });
              } catch {
                setErrorMessage("Couldn't delete that wallpaper, please try again.");
              }
              await refetchWallpapers();
            }}
          >
            Yes, delete
          </UKButton>
          <UKButton color={"filled"} onClick={() => setWallpaperToDelete(undefined)}>
            No, cancel
          </UKButton>
        </UKButtonGroup>
      </UKDialog>
    </>
  );
};

export default WallpaperPage;
