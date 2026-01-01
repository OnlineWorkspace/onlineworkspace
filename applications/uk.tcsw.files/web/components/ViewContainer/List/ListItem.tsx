import { useContext, type Component } from "solid-js";
import styles from "./ListItem.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { useNavigate } from "@solidjs/router";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import trpc from "../../../lib/trpc.ts";
import { ViewContext } from "../ViewContext.ts";
import ItemMenu from "../ItemMenu.tsx";

const ListItem: Component<{
    name: string;
    path: string;
    type: "file" | "directory";
    icon: string;
    index: number;
    refetchGrid: () => void;
}> = (props) => {
    const viewCtx = useContext(ViewContext);
    const navigate = useNavigate();

    return (
        <ItemMenu>
            <div
                class={styles.root}
                data-multiple-of-two={props.index % 2 === 0}
                data-selected={viewCtx?.selectedItems().includes(props.path)}
                onDblClick={async () => {
                    if (props.type === "directory") {
                        navigate(`/app/uk.tcsw.files/dir/${props.path}`);
                    } else {
                        window.open(await trpc.getRawFile.query(props.path));
                    }
                }}
                onContextMenu={() => {
                    let selectedItems = viewCtx?.selectedItems() ?? [];

                    if (!selectedItems.includes(props.path)) {
                        viewCtx?.setSelectedItems([props.path]);
                    }
                }}
                onClick={(e) => {
                    e.stopPropagation();

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
                        if (
                            lastSelectionIndex === props.index ||
                            lastSelectionIndex === undefined
                        ) {
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
                        let itemsBetween: string[] = [];

                        if (lastSelectionIndex < props.index) {
                            for (let i = lastSelectionIndex; i < props.index + 1; i++) {
                                let item = viewCtx?.viewItems()[i];
                                if (item !== undefined) itemsBetween.push(item);
                            }
                        } else {
                            for (let i = lastSelectionIndex; i > props.index - 1; i--) {
                                let item = viewCtx?.viewItems()[i];
                                if (item !== undefined) itemsBetween.push(item);
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
                {props.type === "file" ? (
                    props.icon ? (
                        <img draggable={false} alt="" src={props.icon} loading={"lazy"} />
                    ) : (
                        <UKIcon class={styles.icon}>article</UKIcon>
                    )
                ) : (
                    <UKIcon class={styles.icon}>folder</UKIcon>
                )}
                {viewCtx?.renameEntry() === props.path ? (
                    <>{"rename?"}</>
                ) : (
                    /*<GridItemRename
                    path={props.path}
                    name={props.name}
                    refetchGrid={props.refetchGrid}
                />*/
                    <UKText align="center" role="label" size="m">
                        {props.name}
                    </UKText>
                )}
            </div>
        </ItemMenu>
    );
};

export default ListItem;
