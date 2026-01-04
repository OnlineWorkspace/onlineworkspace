import { createEffect, createSignal, Match, Switch, useContext, type Component } from "solid-js";
import { Ref } from "@solid-primitives/refs";
import GridView from "./Grid/Grid";
import { ViewContext } from "./ViewContext";
import ListView from "./List/List";
import UKMenu from "@tcsw/uikit-solid/src/components/menu/UKMenu.jsx";
import { useParams } from "@solidjs/router";
import styles from "./ViewContainer.module.scss";
import path from "path-browserify";
import trpc from "../../lib/trpc";

const ViewContainer: Component = () => {
    let params = useParams<{ currentPath: string }>();
    const [ref, setRef] = createSignal<Element | undefined>();
    const viewCtx = useContext(ViewContext);
    const [dragRegion, setDragRegion] = createSignal<
        | {
              initialPosition: { x: number; y: number };
              region: {
                  start: {
                      x: number;
                      y: number;
                  };
                  end: {
                      x: number;
                      y: number;
                  };
              };
              currentPosition: { x: number; y: number };
          }
        | undefined
    >(undefined);

    createEffect(() => {
        const region = dragRegion();
        const itemContainer = ref();

        if (region === undefined) return;
        if (!itemContainer) return;

        let newSelectedItems = [];
        const reg = region.region;

        const sel = {
            left: Math.min(reg.start.x, reg.end.x),
            right: Math.max(reg.start.x, reg.end.x),
            top: Math.min(reg.start.y, reg.end.y),
            bottom: Math.max(reg.start.y, reg.end.y),
        };

        if (sel.left === sel.right || sel.top === sel.bottom) return;

        for (const child of itemContainer.children) {
            const rect = child.getBoundingClientRect();

            if (sel.right < rect.left || sel.left > rect.right || sel.bottom < rect.top || sel.top > rect.bottom) {
                continue;
            }

            let path = child.getAttribute("data-path");
            if (path !== null) newSelectedItems.push(path);
        }

        viewCtx?.setSelectedItems(newSelectedItems);
    });

    return (
        <div
            class={styles.root}
            onMouseDown={(e) => {
                if (e.button === 0)
                    setDragRegion({
                        currentPosition: {
                            x: e.clientX,
                            y: e.clientY,
                        },
                        region: {
                            start: {
                                x: e.clientX,
                                y: e.clientY,
                            },
                            end: {
                                x: e.clientX,
                                y: e.clientY,
                            },
                        },
                        initialPosition: {
                            x: e.clientX,
                            y: e.clientY,
                        },
                    });
            }}
            onMouseMove={(e) => {
                setDragRegion((dr) => {
                    if (!dr) return undefined;

                    const currentPosition = {
                        x: e.clientX,
                        y: e.clientY,
                    };

                    let region = {
                        start: {
                            x: 0,
                            y: 0,
                        },
                        end: {
                            x: 0,
                            y: 0,
                        },
                    };

                    if (currentPosition.x < dr.initialPosition.x) {
                        region.start.x = currentPosition.x;
                        region.end.x = dr.initialPosition.x;
                    }
                    if (dr.initialPosition.x < currentPosition.x) {
                        region.start.x = dr.initialPosition.x;
                        region.end.x = currentPosition.x;
                    }
                    if (currentPosition.y < dr.initialPosition.y) {
                        region.start.y = currentPosition.y;
                        region.end.y = dr.initialPosition.y;
                    }
                    if (dr.initialPosition.y < currentPosition.y) {
                        region.start.y = dr.initialPosition.y;
                        region.end.y = currentPosition.y;
                    }

                    return {
                        currentPosition,
                        initialPosition: dr.initialPosition,
                        region: region,
                    };
                });
            }}
            onMouseUp={(e) => {
                if (e.button === 0) {
                    if (
                        dragRegion()?.currentPosition.x === dragRegion()?.initialPosition.x &&
                        dragRegion()?.currentPosition.y === dragRegion()?.initialPosition.y
                    ) {
                        viewCtx?.setSelectedItems([]);
                    }
                }

                setDragRegion(undefined);
            }}
            onMouseEnter={(e) => {
                // if the left mouse button is not pressed
                if (!Boolean(e.buttons & (1 << 0))) {
                    setDragRegion(undefined);
                }
            }}
        >
            <div
                class={styles.dragSelection}
                style={{
                    top: (dragRegion()?.region.start.y || 0) + "px",
                    left: (dragRegion()?.region.start.x || 0) + "px",
                    height: (dragRegion()?.region.end.y || 0) - (dragRegion()?.region.start.y || 0) + "px",
                    width: (dragRegion()?.region.end.x || 0) - (dragRegion()?.region.start.x || 0) + "px",
                }}
            ></div>
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
                <Switch fallback={<>You have no view type selected?</>}>
                    <Match when={viewCtx?.viewType() === "grid"}>
                        <Ref ref={setRef}>
                            <GridView />
                        </Ref>
                    </Match>
                    <Match when={viewCtx?.viewType() === "list"}>
                        <Ref ref={setRef}>
                            <ListView />
                        </Ref>
                    </Match>
                </Switch>
            </UKMenu>
        </div>
    );
};

export default ViewContainer;
