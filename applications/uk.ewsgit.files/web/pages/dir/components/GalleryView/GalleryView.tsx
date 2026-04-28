import ICON_CHEVRON_LEFT from "@material-symbols/svg-700/outlined/chevron_left.svg";
import ICON_CHEVRON_RIGHT from "@material-symbols/svg-700/outlined/chevron_right.svg";
import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.jsx";
import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.jsx";
import UKIconButton from "@onlineworkspace/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import clsx from "clsx";
import browserPath from "path-browserify";
import {type Component, createEffect, createResource, For, useContext} from "solid-js";
import {AppContext} from "../../../../appContext";
import filesystemInterface from "../../../../lib/filesystemInterface";
import trpc from "../../../../lib/trpc";
import iconForItemType from "../../iconForItemType";
import onItemClick from "../../itemClick";
import styles from "./GalleryView.module.scss";

const GalleryView: Component = () => {
  const appContext = useContext(AppContext);
  const [ galleryPreviewMainImage, {refetch: refetchGalleryPreviewMainImage} ] = createResource(() => {
    // @ts-ignore
    const parsedPath = filesystemInterface.urlToPath(appContext?.viewState.selectedItems?.[ 0 ] || "");

    if (parsedPath.type === "remote") {
      return trpc.view.getGalleryItem.query({height: 768, path: parsedPath.path || undefined});
    }

    alert("this view is unsupported on this configuration");
    return {image: "/assets/generic_background.svg", dimensions: {width: 0, height: 0}};
  });

  createEffect(() => {
    appContext?.viewState.selectedItems;

    refetchGalleryPreviewMainImage();
  });

  return (
    <div class={styles.page}>
      <div class={styles.galleryHeader}>
        <div class={styles.galleryItems}>
          <div class={styles.galleryItem}></div>
          <div class={styles.galleryItem}></div>
        </div>
        <UKIconButton icon={ICON_CHEVRON_LEFT} alt="Go back" onClick={() => 0} class={styles.galleryHeaderBackButton} />
        <UKIconButton icon={ICON_CHEVRON_RIGHT} alt="Go forward" onClick={() => 0} class={styles.galleryHeaderForwardsButton} />
        <div class={styles.galleryPreviewMain}>
          <div>
            <UKText size="l" role="label">
              Filename.ext
            </UKText>
          </div>
          <img
            class={styles.galleryPreviewMainImage}
            style={{"aspect-ratio": `${galleryPreviewMainImage()?.dimensions?.width} / ${galleryPreviewMainImage()?.dimensions?.height}`}}
            alt=""
            src={galleryPreviewMainImage()?.image || "/assets/generic_background.svg"}
          />
        </div>
        <div class={styles.galleryItems}>
          <div class={styles.galleryItem}></div>
          <div class={styles.galleryItem}></div>
        </div>
      </div>
      <div class={styles.galleryItemsGrid}>
        <For each={appContext?.viewState.viewItems}>
          {(item, index) => {
            if (!appContext?.userPreferences.showHidden && item.hidden) return null;

            return (
              <UKCard
                class={clsx(styles.item, item.hidden && styles.itemHidden)}
                data-fs-item-path={item.path}
                onClick={(e) => onItemClick(e, appContext!, index(), item, () => 0)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDblClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                color={appContext?.viewState.selectedItems.includes(item.path) ? "outlined" : "filled"}
              >
                {item.thumbnail !== undefined ? (
                  <img class={styles.itemThumbnail} alt="" src={item.thumbnail} loading="lazy" />
                ) : (
                  <UKIcon class={styles.thumbnailIcon}>{iconForItemType(item.type)}</UKIcon>
                )}
                {item.type === "directory" && browserPath.basename(item.path)}
              </UKCard>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default GalleryView;
