import type { Component } from "solid-js";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import { useNavigate } from "@solidjs/router";
import styles from "./Index.module.scss"

const ColorThemePage: Component = () => {
    const navigate = useNavigate()

    return (
        <div>
            <UKButton
                class={styles.backButton}
                color={"tonal"}
                leadingIcon={"chevron_left"}
                onClick={() => {
                    navigate("/app/uk.tcsw.settings/customization");
                }}
            >
                Back
            </UKButton>
            Color Theme
        </div>
    );
}

export default ColorThemePage
