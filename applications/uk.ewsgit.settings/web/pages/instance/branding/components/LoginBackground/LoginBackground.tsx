import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import {type Component, createResource, Show} from "solid-js";
import ImageUploadAndPreview from "../ImageUploadAndPreview/ImageUploadAndPreview.tsx";
import trpc from "../../../../../lib/trpc.js";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.js";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.js";
import styles from "./LoginBackground.module.scss";
import clsx from "clsx";

const LoginBackground: Component = () => {
  const [enabled, {mutate: setEnabled}] = createResource(() => trpc.instance.branding.loginBackground.isEnabled.query(), {initialValue: true})

  return (
    <UKStackItem
      labelText="Login Background"
      supportingText="Recommended size: 2560x1440px. This is displayed as the background of the user login page."
      expandedComponent={<div class={styles.content}>
        <div class={clsx(styles.toggleContainer, enabled() && styles.enabled)}>
          <UKText role={"label"} size={"l"}>Enable Login Background</UKText>
          <UKSwitch value={enabled()} onValueChange={async (val) => {
            await trpc.instance.branding.loginBackground.setEnabled.mutate(val);
            setEnabled(val);
          }}/>
        </div>
        <Show when={enabled()}>
          <ImageUploadAndPreview trpcSegment={"loginBackground"}/>
        </Show>
      </div>}
    />
  );
};

export default LoginBackground;
