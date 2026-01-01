import { useContext, type Component, type ParentProps } from "solid-js";
import { ViewContext } from "./ViewContext.ts";
import UKMenu from "@tcsw/uikit-solid/src/components/menu/UKMenu.jsx";

const ItemMenu: Component<ParentProps> = (props) => {
    const viewCtx = useContext(ViewContext);

    return (
        <UKMenu
            items={[
                {
                    type: "category",
                    label: "Open",
                    supportingText: "Default: New Tab",
                    onClick() {},
                },
                {
                    type: "spacer",
                },
                {
                    type: "button",
                    label: "Cut",
                    leadingIcon: "content_cut",
                    onClick() {},
                },
                {
                    type: "button",
                    label: "Copy",
                    leadingIcon: "content_copy",
                    onClick() {},
                },
                {
                    type: "button",
                    label: "Paste",
                    leadingIcon: "content_paste",
                    onClick() {},
                },
                {
                    type: "button",
                    label: /*viewCtx!.selectedItems().length > 1 ? "Bulk Rename" : */ "Rename",
                    supportingText: "(Only the first selected item)",
                    leadingIcon: "edit",
                    onClick() {
                        let selectedItems = viewCtx?.selectedItems();

                        if (!selectedItems) return;

                        viewCtx?.setRenameEntry(selectedItems[0]);
                    },
                },
                {
                    type: "spacer",
                },
                {
                    type: "button",
                    label: "Sharing",
                    leadingIcon: "share",
                    onClick() {
                        console.log("3");
                    },
                },
                {
                    type: "button",
                    label: "Permissions",
                    leadingIcon: "admin_panel_settings",
                    onClick() {
                        console.log("3");
                    },
                },
            ]}
        >
            {props.children}
        </UKMenu>
    );
};

export default ItemMenu;
