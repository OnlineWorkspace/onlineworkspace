import type { Component } from "solid-js";
import styles from "./Shortcut.module.scss";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";
import { useNavigate } from "@solidjs/router";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.tsx";

const Shortcut: Component<{
    title: string;
    description: string;
    icon: string;
    path: string;
}> = (props) => {
    const navigate = useNavigate();

    return (
        <>
            <UKStackItem
                leading={{
                    type: "icon",
                    value: props.icon,
                }}
                onClick={() => {
                    navigate(props.path);

                    return;
                }}
                labelText={props.title}
                supportingText={props.description}
                inlineComponent={<UKIcon class={styles.iconButton}>arrow_right</UKIcon>}
            />
        </>
    );
};

export default Shortcut;
