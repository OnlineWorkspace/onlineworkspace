import { type Component, createResource, For, Match, onCleanup, onMount, Suspense, Switch, useContext } from "solid-js";
import styles from "./Grid.module.scss";
import { useNavigate, useParams } from "@solidjs/router";
import trpc from "../../../lib/trpc";
import GridItem from "./GridItem";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@tcsw/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import { ViewContext } from "../ViewContext";

const GridView: Component = () => {
    const params = useParams();
    const navigate = useNavigate();
    const viewCtx = useContext(ViewContext);

    const [gridResource, { refetch: refetchGrid }] = createResource(
        () => `/${params.currentPath || ""}`,
        async (pth) => {
            viewCtx?.setLastSelectionIndex(undefined);
            viewCtx?.setSelectedItems([]);
            const items = await trpc.getFileGrid.query({ path: pth, sortBy: "name" });
            if (items.type === "success") {
                viewCtx?.setViewItems(items.items.map((i) => i));
            } else {
                viewCtx?.setViewItems([]);
            }
            return items;
        },
    );

    const keydownListener = (e: KeyboardEvent) => {
        if (e.key === "ArrowUp") {
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
            let selectedItems = viewCtx!.selectedItems();
            viewCtx!.setCutItems(selectedItems);
            viewCtx!.setCopyItems([]);
            viewCtx!.setSelectedItems([]);
        }
        if (e.key === "c" && e.ctrlKey) {
            let selectedItems = viewCtx!.selectedItems();
            viewCtx!.setCopyItems(selectedItems);
            viewCtx!.setCutItems([]);
            viewCtx!.setSelectedItems([]);
        }
    };

    onMount(() => {
        window.addEventListener("keydown", keydownListener);
    });

    onCleanup(() => {
        window.removeEventListener("keydown", keydownListener);
    });

    return (
        <div
            class={styles.root}
            onClick={() => {
                viewCtx?.setSelectedItems([]);
            }}
        >
            <Suspense>
                <Switch
                    fallback={
                        <div class={styles.errorMessage}>
                            {/* @ts-ignore */}
                            <UKIcon>{gridResource()?.icon}</UKIcon>
                            <UKDivider direction={DividerDirection.horizontal} />
                            <UKText role={"body"} size={"l"}>
                                {/* @ts-ignore */}
                                {gridResource()?.message}
                            </UKText>
                            <UKButtonGroup size={"s"}>
                                <UKButton
                                    color={"filled"}
                                    size={"s"}
                                    leadingIcon={"upload"}
                                    onClick={() => {
                                        alert("Implement me!");
                                    }}
                                >
                                    Upload File
                                </UKButton>
                                <UKButton
                                    color={"tonal"}
                                    size={"s"}
                                    leadingIcon={"add"}
                                    onClick={() => {
                                        alert("Implement me!");
                                    }}
                                >
                                    Create File
                                </UKButton>
                            </UKButtonGroup>
                        </div>
                    }
                >
                    <Match when={gridResource()?.type === "success"}>
                        {/* @ts-ignore */}
                        <For each={gridResource()?.items}>
                            {(i, index) => {
                                return <GridItem {...i} index={index()} refetchGrid={refetchGrid} />;
                            }}
                        </For>
                    </Match>
                    <Match when={gridResource()?.type === "error"}>
                        <div class={styles.errorMessage}>
                            {/* @ts-ignore */}
                            <UKIcon>{gridResource()?.icon}</UKIcon>
                            <UKDivider direction={DividerDirection.horizontal} />
                            <UKText role={"body"} size={"l"}>
                                {/* @ts-ignore */}
                                {gridResource()?.message}
                            </UKText>
                            <UKButton
                                color={"filled"}
                                size={"m"}
                                leadingIcon={"house"}
                                onClick={() => {
                                    navigate("/app/uk.tcsw.files/dir/");
                                }}
                            >
                                Go Home
                            </UKButton>
                        </div>
                    </Match>
                </Switch>
            </Suspense>
        </div>
    );
};

export default GridView;
