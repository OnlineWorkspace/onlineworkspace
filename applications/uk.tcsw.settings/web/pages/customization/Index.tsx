import type { Component } from "solid-js";
import ThemePreview from "./components/ThemePreview/ThemePreview.tsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.tsx";
import { useNavigate } from "@solidjs/router";
import styles from "./Index.module.scss"

const CustomizationPage: Component = () => {
    const navigate = useNavigate()

    return (
        <div class={styles.page}>
            <div class={styles.header}>
            <ThemePreview />
            </div>
            <UKStack>
                <UKStackItem labelText={"Color Theme"} onClick={() => {
                    navigate("/app/uk.tcsw.settings/customization/color-theme")
                }} />
                <UKStackItem labelText={"Wallpaper"} onClick={() => {
                    navigate("/app/uk.tcsw.settings/customization/wallpaper")
                }} />
            </UKStack>
        </div>
    );
};

export default CustomizationPage;
