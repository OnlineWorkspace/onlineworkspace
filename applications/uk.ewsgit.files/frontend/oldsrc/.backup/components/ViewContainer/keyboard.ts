import path from "path-browserify";
import trpc from "../../lib/trpc";
import { ViewContext } from "./ViewContext";
import type { Params } from "@solidjs/router";

export const onViewKeyPressEvent =
    (params: Params, viewCtx: (typeof ViewContext)["defaultValue"]) => async (e: KeyboardEvent) => {
        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (viewCtx?.selectedItems().length === 0) {
                if (viewCtx.viewItems().length !== 0) viewCtx?.setSelectedItems([viewCtx.viewItems()[0].path]);
            } else {
                if (viewCtx?.selectedItems().length === 1) {
                    let previousSelection = viewCtx
                        .viewItems()
                        .findIndex((i) => i.path === viewCtx?.selectedItems()[0]);
                    if (viewCtx.viewItems()[previousSelection - 1]) {
                        viewCtx?.setSelectedItems([viewCtx.viewItems()[previousSelection - 1].path]);
                    }
                }
            }
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (viewCtx?.selectedItems().length === 0) {
                if (viewCtx.viewItems().length !== 0) viewCtx?.setSelectedItems([viewCtx.viewItems()[0].path]);
            } else {
                if (viewCtx?.selectedItems().length === 1) {
                    let previousSelection = viewCtx
                        .viewItems()
                        .findIndex((i) => i.path === viewCtx?.selectedItems()[0]);
                    if (viewCtx.viewItems()[previousSelection + 1]) {
                        viewCtx?.setSelectedItems([viewCtx.viewItems()[previousSelection + 1].path]);
                    }
                }
            }
        }
        if (e.key === "x" && e.ctrlKey) {
            e.preventDefault();
            let selectedItems = viewCtx!.selectedItems();
            viewCtx!.setCutItems(selectedItems);
            viewCtx!.setCopyItems([]);
            viewCtx!.setSelectedItems([]);
        }
        if (e.key === "c" && e.ctrlKey) {
            e.preventDefault();
            let selectedItems = viewCtx!.selectedItems();
            viewCtx!.setCopyItems(selectedItems);
            viewCtx!.setCutItems([]);
            viewCtx!.setSelectedItems([]);
        }
        if (e.key === "v" && e.ctrlKey) {
            e.preventDefault();
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
                                                i.path.startsWith(path.join(params.currentPath, path.basename(item))),
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
                                                i.path.startsWith(path.join(params.currentPath, path.basename(item))),
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
        }
        if (e.key === "Delete") {
            e.preventDefault();
            let selectedItems = viewCtx!.selectedItems();

            if (!selectedItems) return;

            await trpc.batchDelete.mutate(selectedItems);
            viewCtx!.setSelectedItems([]);
            viewCtx!.setReload();
        }
        if (e.key === "a" && e.ctrlKey) {
            e.preventDefault();
            viewCtx!.setSelectedItems(viewCtx!.viewItems().map((i) => i.path));
        }
    };
