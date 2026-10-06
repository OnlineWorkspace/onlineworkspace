import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createSignal, For } from "solid-js";
import { FieldError } from "../components/ChoiceStep/ChoiceStep";
import StepPage from "../components/StepPage/StepPage";
import Summary from "../components/Summary/Summary";
import styles from "../Setup.module.scss";
import { formatBytes } from "../state";
import { THEME_PRESETS } from "../themePresets";
import type { StepProps } from "./types";

const Review: Component<StepProps & { goTo(stepId: string): void; apply(): Promise<string | undefined> }> = (props) => {
  const [error, setError] = createSignal<string>();
  const s = () => props.state;

  const sections = () => [
    { id: "address", title: "Address", rows: [["Hostname", s().address.hostname], ["HTTPS", s().address.secure ? "Yes" : "No"]] as [string, string][] },
    { id: "branding", title: "Branding", rows: [["Name", s().branding.displayName], ["Tagline", s().branding.tagline || "None"], ["Default theme", THEME_PRESETS.find((t) => t.id === s().branding.theme)?.name ?? "Default"]] as [string, string][] },
    { id: "login", title: "Login page", rows: [["Sign in with", s().login.method === "profiles" ? "Profiles" : "Username and password"], ["Background", s().login.showBackground ? "Shown" : "Hidden"], ["Banner", s().login.showBanner ? "Shown" : "Hidden"]] as [string, string][] },
    { id: "mail", title: "Email", rows: [["Mail server", s().mailServer.enabled ? `${s().mailServer.host}:${s().mailServer.port}` : "Not configured"]] as [string, string][] },
    {
      id: "access",
      title: "Sign-ups and security",
      rows: [["Public sign-ups", s().access.allowSignups ? "Allowed" : "Closed"], ["Email required", s().access.requireEmail ? "Yes" : "No"], ["Two factor can be skipped", s().access.requireTwoFactor ? "No" : "Yes"], ["Minimum password length", String(s().access.passwordMinimumLength)]] as [string, string][],
    },
    { id: "administrator", title: "Administrator", rows: [["Username", s().administrator.username], ["Display name", s().administrator.displayName]] as [string, string][] },
    { id: "newUsers", title: "New users", rows: [["Storage quota", formatBytes(s().newUsers.quotaSize)], ["Home folders", s().newUsers.homeDirectories.join(", ") || "None"]] as [string, string][] },
    { id: "applications", title: "Applications", rows: [["Enabled", `${s().applications.enabled.length} of ${props.defaults.applications.installed.length}`]] as [string, string][] },
    { id: "terms", title: "Terms of use", rows: [["Terms", "Custom text"]] as [string, string][] },
  ];

  return (
    <StepPage
      title={"Review and finish"}
      description={"Check everything looks right. Nothing is applied until you finish."}
      actions={
        <>
          <UKButton color={"outlined"} onClick={() => props.onBack?.()}>
            Back
          </UKButton>
          <UKButton
            affirmative={true}
            color={"filled"}
            onClick={async () => {
              setError(undefined);
              const message = await props.apply();

              if (message) {
                setError(message);
                return { state: AffirmativeButtonState.Error };
              }

              return { state: AffirmativeButtonState.Success };
            }}
          >
            Finish setup
          </UKButton>
        </>
      }
    >
      <div class={styles.reviewGrid}>
        <For each={sections()}>
          {(section) => (
            <div class={styles.reviewSection}>
              <div class={styles.sectionHeader}>
                <UKText role={"title"} size={"l"} align={"start"}>
                  {section.title}
                </UKText>
                <UKButton color={"tonal"} onClick={() => props.goTo(section.id)}>
                  Edit
                </UKButton>
              </div>
              <Summary rows={section.rows} />
            </div>
          )}
        </For>
      </div>
      <FieldError message={error()} />
    </StepPage>
  );
};

export default Review;
