import { useContext, type Component } from "solid-js";
import styles from "./StatusBar.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import { ViewContext } from "../ViewContainer/ViewContext.ts";

const StatusBar: Component = () => {
    const viewCtx = useContext(ViewContext);

    return (
        <div class={styles.root}>
            {viewCtx!.activeTasks()?.[0] ? (
                <>
                    <UKText role={"label"} size={"m"}>
                        {viewCtx!.activeTasks()?.[0].message}
                    </UKText>
                </>
            ) : (
                <UKText role={"label"} size={"m"}>
                    You currently have no active tasks...
                </UKText>
            )}
        </div>
    );
};

export default StatusBar;
