import { useContext, type Component } from "solid-js";
import styles from "./index.module.scss";
import ViewContainer from "../../components/ViewContainer/ViewContainer";
import UKMenu from "@tcsw/uikit-solid/src/components/menu/UKMenu.tsx";
import { ViewContext } from "../../components/ViewContainer/ViewContext.ts";

const RootPage: Component = () => {
    const viewCtx = useContext(ViewContext);

    return (
        <div class={styles.root}>
            <UKMenu
                items={[
                    viewCtx!.cutItems().length > 0 || viewCtx!.copyItems().length > 0
                        ? {
                              type: "button",
                              label: "Paste",
                              leadingIcon: "content_paste",
                              onClick() {
                                  // do tRPC to paste here
                                  viewCtx!.setSelectedItems([]);
                                  viewCtx!.setCopyItems([]);
                                  viewCtx!.setCutItems([]);
                              },
                          }
                        : undefined,
                    viewCtx!.selectedItems().length === viewCtx!.viewItems().length
                        ? undefined
                        : {
                              type: "button",
                              label: "Select All",
                              leadingIcon: "select_all",
                              onClick() {
                                  viewCtx!.setSelectedItems(viewCtx!.viewItems().map((i) => i.path));
                              },
                          },
                    viewCtx!.selectedItems().length === 0
                        ? undefined
                        : {
                              type: "button",
                              label: "Deselect All",
                              leadingIcon: "remove_selection",
                              onClick() {
                                  viewCtx!.setSelectedItems([]);
                              },
                          },
                    {
                        type: "button",
                        label: "Refresh",
                        leadingIcon: "refresh",
                        onClick() {
                            window.location.reload();
                        },
                    },
                ]}
            >
                <ViewContainer />
            </UKMenu>
        </div>
    );
};

export default RootPage;
