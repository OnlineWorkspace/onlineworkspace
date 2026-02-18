import { useNavigate } from "@solidjs/router";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { createResource, type Component } from "solid-js";
import styles from "./Index.module.scss";
import QuickShortcuts from "./components/quickShortcuts/QuickShortcuts";
import trpc from "../../../lib/trpc";

const QuickShortcutsPage: Component = () => {
    const navigate = useNavigate();
    const [data] = createResource(() => trpc.customization.quickShortcuts.get.query());

    return (
        <>
            <UKTopAppBar
                type={"small"}
                headline={"Quick Shortcuts"}
                leadingButton={{
                    accessibleLabel: "Back",
                    icon: "chevron_left",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/customization");
                    },
                }}
            />
            <div class={styles.page}>
                {data() && <QuickShortcuts defaultValue={data()?.defaultValue} currentValue={data()?.currentValue} />}
            </div>
        </>
    );
};

export default QuickShortcutsPage;
