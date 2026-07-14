import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, For, Suspense } from "solid-js";
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
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.page}>
        <UKStackLabel>Applications</UKStackLabel>
        <Suspense>
          <UKStack>
            <For each={applications()}>
              {(app) => {
                return (
                  <UKStackItem leading={{ type: "icon", value: `/api/application-icon/${app.id}`, alt: `${app.displayName} icon` }} labelText={app.displayName} supportingText={app.id} onClick={() => navigate(`/app/uk.ewsgit.settings/applications/${app.id}`)} />
                );
              }}
            </For>
          </UKStack>
        </Suspense>
      </div>
    </>
  );
};

export default ApplicationsPage;
