import { useContext, type Component, type ParentProps } from "solid-js";
import { ViewContext } from "./ViewContext.ts";
import UKMenu from "@tcsw/uikit-solid/src/components/menu/UKMenu.jsx";
import trpc from "../../lib/trpc.ts";
import { useNavigate } from "@solidjs/router";

const ItemMenu: Component<ParentProps> = (props) => {
    const viewCtx = useContext(ViewContext);
    const navigate = useNavigate();

    return (
        <UKMenu
            items={[
                viewCtx!.selectedItems().length === 1
                    ? {
                          type: "category",
                          label: "Open",
                          supportingText:
                              viewCtx!.viewItems().find((i) => i.path === viewCtx!.selectedItems()?.[0])?.type ===
                              "file"
                                  ? "Default: New Tab"
                                  : "Default: Current Tab",
                          async onClick() {
                              let selectedItems = viewCtx!.selectedItems();
                              const viewItem = viewCtx!.viewItems().find((i) => i.path === selectedItems[0]);

                              if (!viewItem) return;

                              switch (viewItem.type) {
                                  case "file":
                                      window.open(await trpc.getRawFile.query(viewItem.path), "_blank");
                                      break;
                                  default:
                                      navigate(`/app/uk.tcsw.files/dir/${viewItem.path}`);
                              }
                          },
                      }
                    : undefined,
                {
                    type: "spacer",
                },
                {
                    type: "button",
                    label: "Cut",
                    leadingIcon: "content_cut",
                    onClick() {
                        let selectedItems = viewCtx!.selectedItems();
                        viewCtx!.setCutItems(selectedItems);
                        viewCtx!.setCopyItems([]);
                        viewCtx!.setSelectedItems([]);
                    },
                },
                {
                    type: "button",
                    label: "Copy",
                    leadingIcon: "content_copy",
                    onClick() {
                        let selectedItems = viewCtx!.selectedItems();
                        viewCtx!.setCopyItems(selectedItems);
                        viewCtx!.setCutItems([]);
                        viewCtx!.setSelectedItems([]);
                    },
                },
                {
                    type: "button",
                    label: /*viewCtx!.selectedItems().length > 1 ? "Bulk Rename" : */ "Rename",
                    supportingText: viewCtx!.selectedItems().length > 1 ? "(Only the first selected item)" : undefined,
                    leadingIcon: "edit",
                    onClick() {
                        let selectedItems = viewCtx!.selectedItems();

                        if (!selectedItems) return;

                        viewCtx!.setRenameEntry(selectedItems[0]);
                    },
                },
                {
                    type: "button",
                    label: "Delete",
                    leadingIcon: "delete_forever",
                    async onClick() {
                        let selectedItems = viewCtx!.selectedItems();

                        if (!selectedItems) return;

                        await trpc.batchDelete.mutate(selectedItems);
                        viewCtx!.setSelectedItems([]);
                        viewCtx!.setReload();
                    },
                },
                {
                    type: "spacer",
                },
                {
                    type: "button",
                    label: "Sharing",
                    leadingIcon: "share",
                    selected: true,
                    disabled: true,
                    onClick() {
                        console.log("3");
                    },
                },
                {
                    type: "button",
                    label: "Permissions",
                    leadingIcon: "admin_panel_settings",
                    disabled: true,
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
