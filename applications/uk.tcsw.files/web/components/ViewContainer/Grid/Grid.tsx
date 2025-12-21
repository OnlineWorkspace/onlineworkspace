import { type Component, createResource, createSignal, For, Suspense } from "solid-js";
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

const GridView: Component = () => {
    const params = useParams();
    const navigate = useNavigate();
    const [selectedItems, setSelectedItems] = createSignal<string[]>([]);

    const [gridResource] = createResource(
        () => `/${params.currentPath || ""}`,
        (pth) => {
            setSelectedItems([]);
            return trpc.getFileGrid.query({ path: pth, sortBy: "name" });
        },
    );

    return (
        <div class={styles.root}>
            <Suspense>
                {gridResource()?.type === "success" ? (
                    // @ts-ignore
                    <For each={gridResource()?.items}>
                        {(i) => {
                            return (
                                <GridItem
                                    {...i}
                                    selected={selectedItems().includes(i.path)}
                                    setSelected={(sel) =>
                                        setSelectedItems((items) => {
                                            if (!sel) {
                                                if (items.includes(i.path)) {
                                                    return items.filter((fi) => fi !== i.path);
                                                }

                                                return items;
                                            }

                                            return [...items, i.path];
                                        })
                                    }
                                />
                            );
                        }}
                    </For>
                ) : gridResource()?.type === "error" ? (
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
                ) : (
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
                )}
            </Suspense>
        </div>
    );
};

export default GridView;
