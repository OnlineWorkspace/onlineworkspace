import type { Component } from "solid-js";
import styles from "./SideBar.module.scss"
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import { useNavigate } from "@solidjs/router";

const SideBar: Component = () => {
    const navigate = useNavigate();

    return (
        <div class={styles.root}>
            <img class={styles.headerImage} alt={""} src={"/assets/tricolor/tricolor_transparent_dark_background.svg"}/>
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
            <UKDivider direction={DividerDirection.horizontal} />
            <UKButton
                color={"standard"}
                size={"s"}
                leadingIcon={"house"}
                onClick={() => {
                    navigate(`/app/uk.tcsw.files/dir/users/`);
                }}
            >
                Home
            </UKButton>
            <UKButton
                color={"standard"}
                size={"s"}
                leadingIcon={"data_usage"}
                onClick={() => {
                    navigate(`/app/uk.tcsw.files/dir/`);
                }}
            >
                Root
            </UKButton>
        </div>
    );
}

export default SideBar;
