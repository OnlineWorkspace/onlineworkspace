import type { Component } from "solid-js";
import styles from "./GridItem.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { useNavigate } from "@solidjs/router";

const GridItem: Component<{ name: string; path: string; type: "file" | "directory"; icon: string }> = (props) => {
    const navigate = useNavigate();

    return (
        <div
            class={styles.root}
            onClick={() => {
                if (props.type === "directory") navigate(`/app/uk.tcsw.files/dir/${props.path}`);
            }}
        >
            <img draggable={false} alt="" src={props.icon} />
            <UKText align="center" role="label" size="m">
                {props.name}
            </UKText>
        </div>
    );
};

export default GridItem;
