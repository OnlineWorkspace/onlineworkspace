import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import type { Component } from "solid-js";
import styles from "./Shortcut.module.scss";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { useNavigate } from "@solidjs/router";

const Shortcut: Component<{
    title: string;
    description: string;
    icon: string;
    path: string;
}> = (props) => {
    const navigate = useNavigate();

    return (
        <>
            <UKCard
                class={styles.root}
                onClick={() => {
                    navigate(props.path);

                    return;
                }}
            >
                <UKIcon class={styles.icon}>{props.icon}</UKIcon>
                <div>
                    <UKText class={styles.title} role="display" size="s">
                        {props.title}
                    </UKText>
                    <UKText class={styles.description} role="body" size="m">
                        {props.description}
                    </UKText>
                </div>
                <UKIcon class={styles.iconButton}>arrow_right</UKIcon>
            </UKCard>
        </>
    );
};

export default Shortcut;
