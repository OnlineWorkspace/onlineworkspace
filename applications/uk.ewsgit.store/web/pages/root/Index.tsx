import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import {type Component, createResource, For} from "solid-js";
import trpc from "../../lib/trpc";
import PromotedApplication from "./components/PromotedApplication/PromotedApplication";
import styles from "./Index.module.scss";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.js";

const PromotedApplicationsPage: Component = () => {
  const [promotedApplications] = createResource(() => trpc.homepage.promotedApplications.query());

  return (
    <div class={styles.page}>
      <UKTopAppBar type="small" headline={"Promoted Applications"}/>
      <div class={styles.content}>
        <div class={styles.header}>
          <For each={promotedApplications()}>
            {(app) => {
              return <PromotedApplication repository={app.repository} applicationId={app.applicationId}/>;
            }}
          </For>
        </div>
        <UKDivider direction={"horizontal"} width={"middle-inset"}/>
        <div>
          More apps here?
        </div>
      </div>
    </div>
  );
};

export default PromotedApplicationsPage;
