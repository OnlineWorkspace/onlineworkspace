import { useContext, type Component } from "solid-js";
import styles from "./index.module.scss";
import ViewContainer from "../../components/ViewContainer/ViewContainer";
import UKMenu from "@tcsw/uikit-solid/src/components/menu/UKMenu.tsx";
import { ViewContext } from "../../components/ViewContainer/ViewContext.ts";
import trpc from "../../lib/trpc.ts";
import path from "path-browserify";
import { useParams } from "@solidjs/router";

const RootPage: Component = () => {
    const viewCtx = useContext(ViewContext);
    let params = useParams<{ currentPath: string }>();

    return (
        <div class={styles.root}>
            <UKMenu
                items={[
                    viewCtx!.cutItems().length > 0 || viewCtx!.copyItems().length > 0
                        ? {
                              type: "button",
                              label: "Paste",
                              leadingIcon: "content_paste",
                              async onClick() {
                                  let copyItems = viewCtx!.copyItems();

                                  if (copyItems.length > 0) {
                                      await trpc.batchCopy.mutate(
                                          copyItems.map((item) => {
                                              let newPath = path.join(params.currentPath || "", path.basename(item));

                                              if (path.join(item, "..") === params.currentPath || "") {
                                                  newPath = path.join(
                                                      params.currentPath || "",
                                                      path.basename(item) +
                                                          ` (${
                                                              viewCtx!
                                                                  .viewItems()
                                                                  .filter((i) =>
                                                                      i.path.startsWith(
                                                                          path.join(
                                                                              params.currentPath,
                                                                              path.basename(item),
                                                                          ),
                                                                      ),
                                                                  ).length
                                                          })`,
                                                  );
                                              }

                                              return {
                                                  path: item,
                                                  newPath: newPath,
                                              };
                                          }),
                                      );
                                  }

                                  let cutItems = viewCtx!.cutItems();

                                  if (cutItems.length > 0) {
                                      await trpc.batchMove.mutate(
                                          cutItems.map((item) => {
                                              let newPath = path.join(params.currentPath || "", path.basename(item));

                                              if (path.join(item, "..") === params.currentPath || "") {
                                                  newPath = path.join(
                                                      params.currentPath || "",
                                                      path.basename(item) +
                                                          ` (${
                                                              viewCtx!
                                                                  .viewItems()
                                                                  .filter((i) =>
                                                                      i.path.startsWith(
                                                                          path.join(
                                                                              params.currentPath,
                                                                              path.basename(item),
                                                                          ),
                                                                      ),
                                                                  ).length
                                                          })`,
                                                  );
                                              }

                                              return {
                                                  path: item,
                                                  newPath: newPath,
                                              };
                                          }),
                                      );
                                  }

                                  viewCtx!.setSelectedItems([]);
                                  viewCtx!.setCutItems([]);
                                  viewCtx!.setReload();
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
                            viewCtx!.setReload();
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
