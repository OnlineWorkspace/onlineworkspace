import {
    type Component,
    createResource,
    For,
    Match,
    onCleanup,
    onMount,
    Suspense,
    Switch,
    useContext,
} from "solid-js";
import styles from "./List.module.scss";
import { useNavigate, useParams } from "@solidjs/router";
import trpc from "../../../lib/trpc";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@tcsw/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import { ViewContext } from "../ViewContext";
import ListItem from "./ListItem";

const ListView: Component = () => {
    const params = useParams();
    const navigate = useNavigate();
    const viewCtx = useContext(ViewContext);

    const [listResource, { refetch: refetchList }] = createResource(
        () => `/${params.currentPath || ""}`,
        async (pth) => {
            viewCtx?.setLastSelectionIndex(undefined);
            viewCtx?.setSelectedItems([]);
            const items = await trpc.getFileGrid.query({ path: pth, sortBy: "name" });
            if (items.type === "success") {
                // @ts-ignore
                viewCtx?.setViewItems(items.items.map((i) => i.path));
            } else {
                viewCtx?.setViewItems([]);
            }
            return items;
        },
    );

    const keydownListener = (e: KeyboardEvent) => {
        if (e.key === "ArrowUp") {
            if (viewCtx?.selectedItems().length === 0) {
                if (viewCtx.viewItems().length !== 0)
                    viewCtx?.setSelectedItems([viewCtx.viewItems()[0]]);
            } else {
                if (viewCtx?.selectedItems().length === 1) {
                    let previousSelection = viewCtx
                        .viewItems()
                        .indexOf(viewCtx?.selectedItems()[0]);
                    if (viewCtx.viewItems()[previousSelection - 1]) {
                        viewCtx?.setSelectedItems([viewCtx.viewItems()[previousSelection - 1]]);
                    }
                }
            }
        }
        if (e.key === "ArrowDown") {
            if (viewCtx?.selectedItems().length === 0) {
                if (viewCtx.viewItems().length !== 0)
                    viewCtx?.setSelectedItems([viewCtx.viewItems()[0]]);
            } else {
                if (viewCtx?.selectedItems().length === 1) {
                    let previousSelection = viewCtx
                        .viewItems()
                        .indexOf(viewCtx?.selectedItems()[0]);
                    if (viewCtx.viewItems()[previousSelection + 1]) {
                        viewCtx?.setSelectedItems([viewCtx.viewItems()[previousSelection + 1]]);
                    }
                }
            }
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
                            <UKIcon>{listResource()?.icon}</UKIcon>
                            <UKDivider direction={DividerDirection.horizontal} />
                            <UKText role={"body"} size={"l"}>
                                {/* @ts-ignore */}
                                {listResource()?.message}
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
                    <Match when={listResource()?.type === "success"}>
                        {/* @ts-ignore */}
                        <For each={listResource()?.items}>
                            {(i, index) => {
                                return (
                                    <ListItem {...i} index={index()} refetchGrid={refetchList} />
                                );
                            }}
                        </For>
                    </Match>
                    <Match when={listResource()?.type === "error"}>
                        <div class={styles.errorMessage}>
                            {/* @ts-ignore */}
                            <UKIcon>{listResource()?.icon}</UKIcon>
                            <UKDivider direction={DividerDirection.horizontal} />
                            <UKText role={"body"} size={"l"}>
                                {/* @ts-ignore */}
                                {listResource()?.message}
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

export default ListView;
