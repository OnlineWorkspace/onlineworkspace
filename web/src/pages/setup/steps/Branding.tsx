import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import type { Component } from "solid-js";
import ChoiceStep from "../components/ChoiceStep/ChoiceStep";
import Summary from "../components/Summary/Summary";
import choiceStyles from "../components/ChoiceStep/ChoiceStep.module.scss";
import { THEME_PRESETS } from "../themePresets";
import ThemeCard from "../../../../../applications/uk.ewsgit.settings/web/pages/customization/colorTheme/components/ThemeCard/ThemeCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { createMediaQuery } from "@solid-primitives/media";
import { For } from "solid-js";
import styles from "../Setup.module.scss";
import type { StepProps } from "./types";

const Branding: Component<StepProps> = (props) => {
  const prefersLight = createMediaQuery("(prefers-color-scheme: light)");

  return (
    <ChoiceStep
      {...props}
      title={"Brand your workspace"}
      description={"This is how your instance introduces itself on the login screen and in browser tabs."}
      canContinue={props.state.branding.displayName.trim() !== ""}
      summary={
        <Summary
          rows={[
            ["Name", props.state.branding.displayName],
            ["Tagline", props.state.branding.tagline || "None"],
            ["Description", props.state.branding.metaDescription || "None"],
            ["Default theme", THEME_PRESETS.find((t) => t.id === props.state.branding.theme)?.name ?? "Default"],
          ]}
        />
      }
    >
      <UKTextField
        color={"outlined"}
        label={"Instance name"}
        defaultValue={props.state.branding.displayName}
        onValueChange={(v) => props.setState("branding", "displayName", v)}
        error={props.state.branding.displayName.trim() === ""}
      />
      <UKTextField
        color={"outlined"}
        label={"Tagline"}
        defaultValue={props.state.branding.tagline}
        onValueChange={(v) => props.setState("branding", "tagline", v)}
      />
      <UKTextField
        color={"outlined"}
        as={"textarea"}
        containerClass={choiceStyles.full}
        label={"Description"}
        supportingText={"Used as the page description for search engines"}
        defaultValue={props.state.branding.metaDescription}
        onValueChange={(v) => props.setState("branding", "metaDescription", v)}
      />
      <div class={choiceStyles.full}>
        <UKText role={"title"} size={"s"} align={"start"} class={styles.subtle}>
          Default theme
        </UKText>
        <UKText role={"body"} size={"s"} align={"start"} class={styles.subtle}>
          Used by everyone until they choose their own in settings.
        </UKText>
        <div class={styles.themeList}>
          <For each={THEME_PRESETS}>
            {(preset) => (
              <ThemeCard
                name={preset.name}
                colors={preset.scheme[prefersLight() ? "lightMode" : "darkMode"]}
                selected={props.state.branding.theme === preset.id}
                onClick={() => props.setState("branding", "theme", preset.id)}
              />
            )}
          </For>
        </div>
      </div>
    </ChoiceStep>
  );
};

export default Branding;
