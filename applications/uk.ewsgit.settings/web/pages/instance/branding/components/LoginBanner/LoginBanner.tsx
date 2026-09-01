import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import {type Component, createResource, Show} from "solid-js";
import ImageUploadAndPreview from "../ImageUploadAndPreview/ImageUploadAndPreview.tsx";
import clsx from "clsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.js";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.js";
import trpc from "../../../../../lib/trpc.js";
import styles from "./LoginBanner.module.scss";

const LoginBanner: Component = () => {
  const [enabled, {mutate: setEnabled}] = createResource(() => trpc.instance.branding.loginBanner.isEnabled.query(), {initialValue: true})

  return (
    <UKStackItem
      labelText="Login Banner"
      supportingText="Recommended size: 1200x400px. This is displayed above the user login form."
      expandedComponent={<div class={styles.content}>
        <div class={clsx(styles.toggleContainer, enabled() && styles.enabled)}>
          <UKText role={"label"} size={"l"}>Enable Login Banner</UKText>
          <UKSwitch value={enabled()} onValueChange={async (val) => {
            await trpc.instance.branding.loginBanner.setEnabled.mutate(val);
            setEnabled(val);
          }}/>
        </div>
        <Show when={enabled()}>
          <ImageUploadAndPreview trpcSegment={"loginBanner"}/>
        </Show>
      </div>}
    />
  );
};

export default LoginBanner;
