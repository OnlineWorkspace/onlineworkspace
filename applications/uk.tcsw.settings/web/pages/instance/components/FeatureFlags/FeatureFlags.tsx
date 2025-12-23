import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { createResource, For, Suspense, type Component } from "solid-js";
import instanceStyles from "./../../Index.module.scss";
import trpc from "../../../../lib/trpc";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKSwitch from "@tcsw/uikit-solid/src/components/switch/UKSwitch.jsx";
import styles from "./FeatureFlags.module.scss";

const FeatureFlags: Component = () => {
    const [features, { refetch: refetchFeatures }] = createResource(() =>
        trpc.instance.getFeatures.query(),
    );

    return (
        <>
            <UKText class={instanceStyles.subheading} role="title" size="m" align="start">
                Feature Flags
            </UKText>
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
                                            getValue={async (val) => {
                                                await trpc.instance.setFeature.mutate({
                                                    id: feature.id,
                                                    value: val,
                                                });
                                                refetchFeatures();
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
