import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import { useNavigate } from "@solidjs/router";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKStackLabel from "@tcsw/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { type Component, createResource, For } from "solid-js";
import trpc from "../../lib/trpc.ts";
import styles from "./Index.module.scss";

const ApplicationsPage: Component = () => {
  const navigate = useNavigate();
  const [applications] = createResource(() => trpc.application.getApplications.query());

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Applications"}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.tcsw.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.page}>
        <UKStackLabel>Applications</UKStackLabel>
        <UKStack>
          <For each={applications()}>
            {(app) => {
              return (
                <UKStackItem
                  labelText={app.displayName}
                  supportingText={app.id}
                  onClick={() => navigate(`/app/uk.tcsw.settings/applications/${app.id}`)}
                />
              );
            }}
          </For>
        </UKStack>
      </div>
    </>
  );
};

export default ApplicationsPage;
