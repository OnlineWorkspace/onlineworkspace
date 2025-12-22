import { useContext, type Component } from "solid-js";
import styles from "./GridItem.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { useNavigate } from "@solidjs/router";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import trpc from "../../../lib/trpc.ts";
import { ViewContext } from "../ViewContext.ts";

const GridItem: Component<{
    name: string;
    path: string;
    type: "file" | "directory";
    icon: string;
    index: number;
}> = (props) => {
    const viewCtx = useContext(ViewContext);
    const navigate = useNavigate();

    return (
        <div
            class={styles.root}
            data-selected={viewCtx?.selectedItems().includes(props.path)}
            onDblClick={async () => {
                if (props.type === "directory") {
                    navigate(`/app/uk.tcsw.files/dir/${props.path}`);
                } else if (props.icon) {
                    window.open(await trpc.getRawFile.query(props.path));
                }
            }}
            onClick={(e) => {
                viewCtx?.setLastSelectionIndex(props.index);

                let selectedItems = viewCtx?.selectedItems() ?? [];

                if (e.ctrlKey) {
                    viewCtx?.setLastSelectionIndex(props.index);
                    if (selectedItems.includes(props.path)) {
                        selectedItems = selectedItems.filter((fi) => fi !== props.path);
                        viewCtx?.setSelectedItems(selectedItems);
                    } else {
                        viewCtx?.setSelectedItems([...selectedItems, props.path]);
                    }
                } else if (e.shiftKey) {
                    const lastSelectionIndex = viewCtx?.lastSelectionIndex();
                    if (lastSelectionIndex === props.index || lastSelectionIndex === undefined)
                        return;

                    // select items between lastSelectionIndex and the props.index
                    let itemsBetween: string[] = [];

                    for (let i = lastSelectionIndex; i < (viewCtx?.viewItems().length ?? 0); i++) {
                        let item = viewCtx?.viewItems()[i];
                        if (item !== undefined) itemsBetween.push(item);
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
                    <img draggable={false} alt="" src={props.icon} />
                ) : (
                    <UKIcon class={styles.icon}>article</UKIcon>
                )
            ) : (
                <UKIcon class={styles.icon}>folder</UKIcon>
            )}
            {viewCtx?.renameEntry() === props.path ? (
                <>rename me</>
            ) : (
                <UKText align="center" role="label" size="m">
                    {props.name}
                </UKText>
            )}
        </div>
    );
};

export default GridItem;
