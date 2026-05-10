import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import COLLAPSE_CONTENT_ICON from "@material-symbols/svg-700/outlined/collapse_content.svg";
import EXPAND_CONTENT_ICON from "@material-symbols/svg-700/outlined/expand_content.svg";
import ROTATE_90_DEGREES_CW_ICON from "@material-symbols/svg-700/outlined/rotate_90_degrees_cw.svg";
import SHARE_ICON from "@material-symbols/svg-700/outlined/share.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.jsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.jsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.jsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.jsx";
import clsx from "clsx";
import path from "path-browserify";
import { type Component, createResource, createSignal, Show, Suspense, useContext } from "solid-js";
import { AppContext } from "../../../appContext";
import filesystemInterface, { type UniformResourceLocator } from "../../../lib/filesystemInterface";
import humanReadableSize from "../../../lib/humanReadableSize";
import iconForItemType from "../../../pages/dir/iconForItemType";
import styles from "./PreviewDialog.module.scss";

const PreviewDialog: Component<{ pathUrl: UniformResourceLocator }> = (props) => {
  const appContext = useContext(AppContext);
  const [isExpanded, setIsExpanded] = createSignal<boolean>(false);
  const [originalHasLoaded, setOriginalHasLoaded] = createSignal<boolean>(false);
  const [data] = createResource(
    () => props.pathUrl,
    (url) => filesystemInterface.getPreviewDialogMetadata(url as UniformResourceLocator),
  );

  return (
    <>
      <button
        type="button"
        class={styles.background}
        onClick={() => {
          appContext?.setGlobalState("showPreview", false);
        }}
      />
      <UKCard color="outlined" class={clsx(styles.component, isExpanded() && styles.expanded)}>
        <div class={styles.header}>
          {!appContext?.isDesktopApp && (
            <>
              <UKIconButton
                size="xxs"
                color={"tonal"}
                alt={"Close Preview"}
                onClick={() => {
                  appContext?.setGlobalState("showPreview", false);
                }}
                icon={CLOSE_ICON}
              />
              <UKIconButton
                size="xxs"
                color={"tonal"}
                alt={"Expand preview"}
                onClick={() => {
                  setIsExpanded((p) => !p);
                }}
                icon={isExpanded() ? COLLAPSE_CONTENT_ICON : EXPAND_CONTENT_ICON}
              />
            </>
          )}
          <Suspense>
            <UKText size="m" role="title" class={styles.title}>
              Preview for {path.basename(props.pathUrl)}
            </UKText>
          </Suspense>
          <UKIconButton size="xxs" width="wide" color={"outlined"} alt={"Rotate content by 90 degrees"} onClick={() => { }} icon={ROTATE_90_DEGREES_CW_ICON} />
          <UKIconButton size="xxs" width="wide" color={"outlined"} alt={"Share content"} onClick={() => { }} icon={SHARE_ICON} />
          <UKButton size="xxs" color={"outlined"} onClick={() => { }}>
            Open in [DEFAULT APPLICATION]
          </UKButton>
        </div>
        <div
          class={clsx(
            styles.previewContentContainer,
            (data() as Extract<ReturnType<typeof data>, { status: "ok" }>)?.data?.metadata?.pixelate && styles.pixelate,
          )}
        >
          <Show when={data()!}>
            <Show
              when={!!(data() as Extract<ReturnType<typeof data>, { status: "ok" }>).data.assets}
              fallback={
                <div class={styles.generalContent}>
                  <UKIcon class={styles.generalIcon}>
                    {iconForItemType((data() as Extract<ReturnType<typeof data>, { status: "ok" }>).data.metadata.type as unknown as any)}
                  </UKIcon>
                  <UKDivider direction="vertical" />
                  <div class={styles.metadata}>
                    <UKText size="l" role="headline">
                      {path.basename(props.pathUrl)}
                    </UKText>
                    <UKText size="l" role="body">
                      Contains {(data() as Extract<ReturnType<typeof data>, { status: "ok" }>).data.metadata.itemCount} items
                    </UKText>
                    <UKText size="l" role="label">
                      {humanReadableSize((data() as Extract<ReturnType<typeof data>, { status: "ok" }>).data.metadata.size)}
                    </UKText>
                  </div>
                </div>
              }
            >
              {data()!.status === "ok" && (
                <>
                  <img
                    loading="eager"
                    class={styles.smallPreview}
                    src={(data() as Extract<ReturnType<typeof data>, { status: "ok" }>).data.assets?.small || ""}
                    alt="preview"
                  ></img>
                  {(isExpanded() || originalHasLoaded()) && (
                    <img
                      loading="lazy"
                      class={clsx(originalHasLoaded() && styles.originalHasLoaded, styles.originalPreview)}
                      onLoad={() => setOriginalHasLoaded(true)}
                      src={(data() as Extract<ReturnType<typeof data>, { status: "ok" }>).data.assets?.original || ""}
                      alt="preview"
                    ></img>
                  )}
                </>
              )}
            </Show>
          </Show>
        </div>
      </UKCard>
    </>
  );
};

export default PreviewDialog;
