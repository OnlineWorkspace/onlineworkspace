import type { Component } from "solid-js";
import UsageGraph from "./components/UsageGraph/UsageGraph";
import styles from "./Index.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate } from "@solidjs/router";
import DuplicateFiles from "./components/DuplicateFiles/DuplicateFiles";
import TemporaryFiles from "./components/TemporaryFiles/TemporaryFiles";
import UKStackLabel
  from "@tcsw/uikit-solid/src/components/stack/UKStackLabel.tsx";

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
                <UKStackLabel>
                    Usage Graph
                </UKStackLabel>
                <UsageGraph />
                <UKStackLabel>
                    Duplicate Files
                </UKStackLabel>
                <DuplicateFiles />
                <UKStackLabel>
                    Temporary Files
                </UKStackLabel>
                <TemporaryFiles />
            </div>
        </>
    );
};

export default StoragePage;
