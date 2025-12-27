import type { Component } from "solid-js";
import UsageGraph from "./components/UsageGraph/UsageGraph";
import styles from "./Index.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate } from "@solidjs/router";
import DuplicateFiles from "./components/DuplicateFiles/DuplicateFiles";
import TemporaryFiles from "./components/TemporaryFiles/TemporaryFiles";

const StoragePage: Component = () => {
    const navigate = useNavigate();

    return (
        <>
            <UKTopAppBar
                type="small"
                headline={"Storage"}
                leadingButton={{
                    icon: "chevron_left",
                    onClick() {
                        navigate("/app/uk.tcsw.settings");
                    },
                    accessibleLabel: "Go back",
                }}
            />
            <div class={styles.page}>
                <UKText role={"title"} size={"m"} class={styles.subheading}>
                    Usage Graph
                </UKText>
                <UsageGraph />
                <UKText role={"title"} size={"m"} class={styles.subheading}>
                    Duplicate Files
                </UKText>
                <DuplicateFiles />
                <UKText role={"title"} size={"m"} class={styles.subheading}>
                    Temporary Files
                </UKText>
                <TemporaryFiles />
            </div>
        </>
    );
};

export default StoragePage;
