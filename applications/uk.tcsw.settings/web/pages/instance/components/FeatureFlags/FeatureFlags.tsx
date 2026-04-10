import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKStackLabel from "@tcsw/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKSwitch from "@tcsw/uikit-solid/src/components/switch/UKSwitch.jsx";
import { type Component, createResource, For, Suspense } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./FeatureFlags.module.scss";

const FeatureFlags: Component = () => {
  const [features, { mutate: mutateFeatures }] = createResource(() => trpc.instance.getFeatures.query());

  return (
    <>
      <UKStackLabel>Feature Flags</UKStackLabel>
      <UKStack>
        <Suspense>
          <For each={features()}>
            {(feature) => {
              return (
                <UKStackItem
                  labelText={`${feature.name} ('${feature.id}')`}
                  supportingText={`${feature.description !== undefined ? `${feature.description}` : ""}`}
                  inlineComponent={
                    <UKSwitch
                      class={styles.switch}
                      value={feature.enabled}
                      onValueChange={async (val) => {
                        await trpc.instance.setFeature.mutate({
                          id: feature.id,
                          value: val,
                        });
                        mutateFeatures((feats) =>
                          feats !== undefined
                            ? feats.map((f) => {
                                if (f.id === feature.id)
                                  return {
                                    ...f,
                                    enabled: val,
                                  };

                                return f;
                              })
                            : undefined,
                        );
                      }}
                    />
                  }
                />
              );
            }}
          </For>
        </Suspense>
      </UKStack>
    </>
  );
};

export default FeatureFlags;
