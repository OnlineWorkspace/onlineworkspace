import UKTopAppBar from "@onlineworkspace/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { type Component, createResource, For } from "solid-js";
import trpc from "../../lib/trpc";
import PromotedApplication from "./components/PromotedApplication/PromotedApplication";
import styles from "./Index.module.scss";

const PromotedApplicationsPage: Component = () => {
  const [promotedApplications] = createResource(() => trpc.homepage.promotedApplications.query());

  return (
    <div class={styles.page}>
      <UKTopAppBar type="small" headline={"Promoted Applications"} />
      <div class={styles.content}>
        <For each={promotedApplications()}>
          {(app) => {
            return <PromotedApplication repository={app.repository} applicationId={app.applicationId} />;
          }}
        </For>
      </div>
      {"WARNING! WORK IN PROGRESS PAGE -> YOU PROBABLY WANT THE SEARCH PAGE"}
      <br />
      {"WARNING! WORK IN PROGRESS PAGE -> YOU PROBABLY WANT THE SEARCH PAGE"}
      <br />
      {"WARNING! WORK IN PROGRESS PAGE -> YOU PROBABLY WANT THE SEARCH PAGE"}
      <br />
      {"WARNING! WORK IN PROGRESS PAGE -> YOU PROBABLY WANT THE SEARCH PAGE"}
      <br />
      {"WARNING! WORK IN PROGRESS PAGE -> YOU PROBABLY WANT THE SEARCH PAGE"}
      <br />
      {"WARNING! WORK IN PROGRESS PAGE -> YOU PROBABLY WANT THE SEARCH PAGE"}
    </div>
  );
};

export default PromotedApplicationsPage;
