import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { createResource, For, type Component } from "solid-js";
import styles from "./Index.module.scss";
import PromotedApplication from "./components/PromotedApplication/PromotedApplication";
import trpc from "../../lib/trpc";

const Page: Component = () => {
    const [promotedApplications] = createResource(() => trpc.homepage.promotedApplications.query());

    return (
        <div class={styles.page}>
            <div class={styles.topBar}>
                <UKText role={"title"} size="l">
                    Promoted Applications
                </UKText>
            </div>
            <UKDivider direction={DividerDirection.horizontal} />
            <div class={styles.content}>
                <For each={promotedApplications()}>
                    {(app) => {
                        return <PromotedApplication repository={app.repository} applicationId={app.applicationId} />;
                    }}
                </For>
            </div>
        </div>
    );
};

export default Page;
