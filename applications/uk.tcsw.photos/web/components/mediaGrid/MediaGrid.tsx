import { For, type Component } from "solid-js";
import styles from "./MediaGrid.module.scss";

const MediaGrid: Component<{ items: { src: string; size: { width: number; height: number } }[] }> = (props) => {
    return (
        <div class={styles.component}>
            <For each={props.items}>
                {(item) => {
                    return (
                        <div class={styles.item} style={{ "aspect-ratio": `${item.size.width} / ${item.size.height}` }}>
                            <img src={item.src} />
                        </div>
                    );
                }}
            </For>
        </div>
    );
};

export default MediaGrid;
