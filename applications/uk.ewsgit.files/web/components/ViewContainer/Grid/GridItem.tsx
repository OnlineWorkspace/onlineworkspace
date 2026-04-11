import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import { useNavigate } from "@solidjs/router";
import { type Component, useContext } from "solid-js";
import trpc from "../../../lib/trpc.ts";
import ItemMenu from "../ItemMenu.tsx";
import { ViewContext } from "../ViewContext.ts";
import type { ViewItem } from "../viewItem.ts";
import styles from "./GridItem.module.scss";
import GridItemRename from "./GridItemRename";

const GridItem: Component<
  ViewItem & {
    index: number;
    refetchGrid: () => void;
  }
> = (props) => {
  const viewCtx = useContext(ViewContext);
  const navigate = useNavigate();

  return (
    <ItemMenu>
      <div
        class={styles.root}
        data-path={props.path}
        data-selected={viewCtx?.selectedItems().includes(props.path)}
        onDblClick={async () => {
          if (props.type === "directory") {
            navigate(`/app/uk.ewsgit.files/dir/${props.path}`);
          } else {
            if (props.type === "ghost") return;

            window.open(await trpc.getRawFile.query(props.path));
          }
        }}
        onContextMenu={() => {
          const selectedItems = viewCtx?.selectedItems() ?? [];

          if (!selectedItems.includes(props.path)) {
            viewCtx?.setSelectedItems([props.path]);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (props.type === "ghost") return;

          let selectedItems = viewCtx?.selectedItems() ?? [];

          if (e.ctrlKey) {
            if (selectedItems.includes(props.path)) {
              selectedItems = selectedItems.filter((fi) => fi !== props.path);
              viewCtx?.setSelectedItems(selectedItems);
            } else {
              viewCtx?.setSelectedItems([...selectedItems, props.path]);
            }
          } else if (e.shiftKey) {
            const lastSelectionIndex = viewCtx?.lastSelectionIndex();
            if (lastSelectionIndex === props.index || lastSelectionIndex === undefined) {
              viewCtx?.setLastSelectionIndex(props.index);
              if (selectedItems.includes(props.path)) {
                if (selectedItems.length === 1) {
                  viewCtx?.setSelectedItems([]);
                } else {
                  viewCtx?.setSelectedItems([props.path]);
                }
              } else {
                viewCtx?.setSelectedItems([props.path]);
              }
              return;
            }

            // select items between lastSelectionIndex and the props.index
            const itemsBetween: string[] = [];

            if (lastSelectionIndex < props.index) {
              for (let i = lastSelectionIndex; i < props.index + 1; i++) {
                const item = viewCtx?.viewItems()[i];
                if (item !== undefined) itemsBetween.push(item.path);
              }
            } else {
              for (let i = lastSelectionIndex; i > props.index - 1; i--) {
                const item = viewCtx?.viewItems()[i];
                if (item !== undefined) itemsBetween.push(item.path);
              }
            }

            viewCtx?.setSelectedItems(itemsBetween);
          } else {
            viewCtx?.setLastSelectionIndex(props.index);
            if (selectedItems.includes(props.path)) {
              if (selectedItems.length === 1) {
                viewCtx?.setSelectedItems([]);
              } else {
                viewCtx?.setSelectedItems([props.path]);
              }
            } else {
              viewCtx?.setSelectedItems([props.path]);
            }
          }
        }}
      >
        {viewCtx?.cutItems().includes(props.path) ? (
          <UKIcon class={styles.icon}>content_cut</UKIcon>
        ) : props.type === "file" ? (
          props.icon ? (
            <img draggable={false} alt="" src={props.icon} loading={"lazy"} />
          ) : (
            <UKIcon class={styles.icon}>article</UKIcon>
          )
        ) : props.type === "ghost" ? (
          <UKIcon class={styles.icon}>ghost</UKIcon>
        ) : (
          <UKIcon class={styles.icon}>folder</UKIcon>
        )}
        {viewCtx?.renameEntry() === props.path ? (
          <GridItemRename path={props.path} name={props.name} refetchGrid={props.refetchGrid} />
        ) : (
          <UKText align="center" role="label" size="m">
            {props.name}
          </UKText>
        )}
      </div>
    </ItemMenu>
  );
};

export default GridItem;
