import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import { createResource, For, type Component } from "solid-js";
import styles from "./Index.module.scss";
import PromotedApplication from "./components/PromotedApplication/PromotedApplication";
import trpc from "../../lib/trpc";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";

const Page: Component = () => {
    const [promotedApplications] = createResource(() => trpc.homepage.promotedApplications.query());

    return (
        <div class={styles.page}>
            <UKTopAppBar type="small" headline={"Promoted Applications"} />
            <div class={styles.content}>
                <For each={promotedApplications()}>
                    {(app) => {
                        return (
                            <PromotedApplication
                                repository={app.repository}
                                applicationId={app.applicationId}
                            />
                        );
                    }}
                </For>
            </div>
        </div>
    );
};

export default Page;
