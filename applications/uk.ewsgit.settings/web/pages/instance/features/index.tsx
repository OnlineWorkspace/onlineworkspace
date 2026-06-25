import { type Component, createResource, Index, Suspense } from "solid-js";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import { useNavigate } from "@solidjs/router";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import trpc from "../../../lib/trpc.ts";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import styles from "./index.module.scss";
import baseSettingsPageStyles from "../../../BaseSettingsPage.module.scss";

const ManageInstanceFeaturesPage: Component = () => {
  const navigate = useNavigate();
  const [features, { mutate: mutateFeatures }] = createResource(() =>
    trpc.instance.getFeatures.query()
  );

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Manage Instance Enabled Features"}
        subtitle={"Caution: Advanced users only, change at your own risk."}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={baseSettingsPageStyles.baseSettingsPageContent}>
        <UKStackLabel>Feature Flags</UKStackLabel>
        <UKStack>
          <Suspense>
            <Index each={features()}>
              {(feature) => {
                return (
                  <UKStackItem
                    labelText={`${feature().name} ('${feature().id}')`}
                    supportingText={`${
                      feature().description !== undefined
                        ? `${feature().description}`
                        : ""
                    }`}
                    inlineComponent={
                      <UKSwitch
                        class={styles.switch}
                        value={feature().enabled}
                        onValueChange={async (val) => {
                          await trpc.instance.setFeature.mutate({
                            id: feature().id,
                            value: val,
                          });
                          mutateFeatures((feats) =>
                            feats !== undefined
                              ? feats.map((f) => {
                                if (f.id === feature().id) {
                                  return {
                                    ...f,
                                    enabled: val,
                                  };
                                }

                                return f;
                              })
                              : undefined
                          );
                        }}
                      />
                    }
                  />
                );
              }}
            </Index>
          </Suspense>
        </UKStack>
      </div>
    </>
  );
};

export default ManageInstanceFeaturesPage;
