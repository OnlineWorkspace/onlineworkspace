import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createSignal, For } from "solid-js";
import StageHeader from "../../auth/signup/components/StageHeader/StageHeader";
import { FieldError } from "../components/ChoiceStep/ChoiceStep";
import choiceStyles from "../components/ChoiceStep/ChoiceStep.module.scss";
import Summary from "../components/Summary/Summary";
import styles from "../Setup.module.scss";
import { formatBytes } from "../state";
import type { StepProps } from "./types";

const Review: Component<StepProps & { goTo(stepId: string): void; apply(): Promise<string | undefined> }> = (props) => {
  const [error, setError] = createSignal<string>();
  const s = () => props.state;

  const sections = () => [
    { id: "identity", title: "Identity", rows: [["Name", s().identity.displayName], ["Tagline", s().identity.tagline || "None"]] as [string, string][] },
    { id: "address", title: "Address", rows: [["Hostname", s().address.hostname], ["HTTPS", s().address.secure ? "Yes" : "No"]] as [string, string][] },
    { id: "mail", title: "Email", rows: [["Mail server", s().mailServer.enabled ? `${s().mailServer.host}:${s().mailServer.port}` : "Not configured"]] as [string, string][] },
    {
      id: "access",
      title: "Sign-ups and security",
      rows: [["Public sign-ups", s().access.allowSignups ? "Allowed" : "Closed"], ["Email required", s().access.requireEmail ? "Yes" : "No"], ["Two factor required", s().access.requireTwoFactor ? "Yes" : "No"], ["Minimum password length", String(s().access.passwordMinimumLength)]] as [string, string][],
    },
    { id: "administrator", title: "Administrator", rows: [["Username", s().administrator.username], ["Display name", s().administrator.displayName]] as [string, string][] },
    { id: "newUsers", title: "New users", rows: [["Storage quota", formatBytes(s().newUsers.quotaSize)], ["Home folders", s().newUsers.homeDirectories.join(", ") || "None"]] as [string, string][] },
    { id: "applications", title: "Applications", rows: [["Enabled", `${s().applications.enabled.length} of ${props.defaults.applications.installed.length}`]] as [string, string][] },
    { id: "terms", title: "Terms of use", rows: [["Terms", "Custom text"]] as [string, string][] },
  ];

  return (
    <UKCard color={"filled"} class={choiceStyles.card}>
      <StageHeader title={"Review and finish"} description={"Check everything looks right. Nothing is applied until you finish."} />
      <For each={sections()}>
        {(section) => (
          <div class={choiceStyles.fields}>
            <div class={styles.sectionHeader}>
              <UKText role={"title"} size={"s"} align={"start"}>
                {section.title}
              </UKText>
              <UKButton color={"standard"} onClick={() => props.goTo(section.id)}>
                Edit
              </UKButton>
            </div>
            <Summary rows={section.rows} />
          </div>
        )}
      </For>
      <FieldError message={error()} />
      <div class={choiceStyles.buttons}>
        <UKButton color={"tonal"} onClick={() => props.onBack?.()}>
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
      </div>
    </UKCard>
  );
};

export default Review;
