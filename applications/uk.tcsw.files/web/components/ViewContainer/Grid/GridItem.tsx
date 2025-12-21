import type { Component } from "solid-js";
import styles from "./GridItem.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { useNavigate } from "@solidjs/router";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import trpc from "../../../lib/trpc.ts";

const GridItem: Component<{
    name: string;
    path: string;
    type: "file" | "directory";
    icon: string;
    selected: boolean;
    setSelected: (value: boolean) => void;
}> = (props) => {
    const navigate = useNavigate();

    return (
        <div
            class={styles.root}
            data-selected={props.selected}
            onDblClick={async () => {
                if (props.type === "directory") {
                    navigate(`/app/uk.tcsw.files/dir/${props.path}`);
                } else if (props.icon) {
                    window.open(await trpc.getRawFile.query(props.path));
                }
            }}
            onClick={() => {
                props.setSelected(!props.selected);
            }}
        >
            {props.type === "file" ? (
                props.icon ? (
                    <img draggable={false} alt="" src={props.icon} />
                ) : (
                    <UKIcon class={styles.icon}>article</UKIcon>
                )
            ) : (
                <UKIcon class={styles.icon}>folder</UKIcon>
            )}
            <UKText align="center" role="label" size="m">
                {props.name}
            </UKText>
        </div>
    );
};

export default GridItem;
