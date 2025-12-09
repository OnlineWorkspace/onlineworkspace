import { For, type Component } from "solid-js";
import styles from "./ThemePreview.module.scss";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";

const ThemePreview: Component<{ wallpaper?: string }> = (props) => {
    return (
        <div class={styles.root}>
            <img src={props.wallpaper || "/assets/tricolor/tricolor.svg"} class={styles.wallpaper} />
            <div class={styles.sidebar}>
                <div class={styles.menuButton}>
                    <UKIcon>menu</UKIcon>
                </div>
                <div class={styles.avatar}></div>
                <div class={styles.items}>
                    <For each={new Array(3)}>
                        {() => {
                            return (
                                <div class={styles.item}>
                                    <UKIcon>arrow_circle_right</UKIcon>
                                </div>
                            );
                        }}
                    </For>
                </div>
            </div>
        </div>
    );
};

export default ThemePreview;
