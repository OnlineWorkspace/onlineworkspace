import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKSegmentedButton from "@ewsgit/uikit-solid/src/components/segmentedButton/UKSegmentedButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, type JSX, Show } from "solid-js";
import StageHeader from "../../../auth/signup/components/StageHeader/StageHeader";
import styles from "./ChoiceStep.module.scss";

/** the navigation shared by every step */
export interface StepNavigation {
  onBack?(): void;
  onNext(): void;
  nextLabel?: string;
  canContinue?: boolean;
}

/** A step which offers a sensible default, shown as a summary, with the option to customise it */
const ChoiceStep: Component<
  StepNavigation & {
    title: string;
    description: string;
    recommendedLabel?: string;
    custom: boolean;
    onCustomChange(custom: boolean): void;
    summary: JSX.Element;
    children: JSX.Element;
  }
> = (props) => (
  <UKCard color={"filled"} class={styles.card}>
    <StageHeader title={props.title} description={props.description} />
    <UKSegmentedButton
      items={[
        { id: "recommended", label: props.recommendedLabel ?? "Recommended" },
        { id: "custom", label: "Customise" },
      ]}
      selectedId={() => (props.custom ? "custom" : "recommended")}
      onSelect={(id) => props.onCustomChange(id === "custom")}
    />
    <Show when={props.custom} fallback={props.summary}>
      <div class={styles.fields}>{props.children}</div>
    </Show>
    <StepButtons {...props} />
  </UKCard>
);

export const StepButtons: Component<StepNavigation> = (props) => (
  <div class={styles.buttons}>
    <Show when={props.onBack} fallback={<span />}>
      <UKButton color={"tonal"} onClick={() => props.onBack?.()}>
        Back
      </UKButton>
    </Show>
    <UKButton color={"filled"} disabled={props.canContinue === false} onClick={() => props.onNext()}>
      {props.nextLabel ?? "Continue"}
    </UKButton>
  </div>
);

export const FieldError: Component<{ message?: string }> = (props) => (
  <Show when={props.message}>
    <UKText role={"body"} size={"s"} align={"start"} class={styles.error}>
      {props.message}
    </UKText>
  </Show>
);

export default ChoiceStep;
