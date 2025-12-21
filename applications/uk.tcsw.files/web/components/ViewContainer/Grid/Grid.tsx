import { createResource, For, Suspense, type Component } from "solid-js";
import styles from "./Grid.module.scss";
import { useParams } from "@solidjs/router";
import trpc from "../../../lib/trpc";
import GridItem from "./GridItem";

const GridView: Component = () => {
    const params = useParams();

    const [items] = createResource(
        () => `/${params.currentPath || ""}`,
        (pth) => trpc.getFileGrid.query({ path: pth, sortBy: "name" }),
    );

    return (
        <div class={styles.root}>
            <Suspense>
                <For each={items()}>
                    {(i) => {
                        return <GridItem {...i} />;
                    }}
                </For>
            </Suspense>
        </div>
    );
};

export default GridView;
