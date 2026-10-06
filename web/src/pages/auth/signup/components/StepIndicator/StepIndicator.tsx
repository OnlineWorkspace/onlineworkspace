import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, For } from "solid-js";
import styles from "./StepIndicator.module.scss";

/** a segmented progress bar with a "Step n of N" label, `current` is zero based */
const StepIndicator: Component<{ steps: string[]; current: number }> = (props) => (
  <div class={styles.root} role={"progressbar"} aria-valuemin={1} aria-valuemax={props.steps.length} aria-valuenow={props.current + 1}>
    <div class={styles.bars}>
      <For each={props.steps}>{(_, index) => <div class={styles.bar} data-state={index() < props.current ? "done" : index() === props.current ? "current" : "todo"} />}</For>
    </div>
    <UKText role={"label"} size={"m"} align={"start"} class={styles.label}>
      {`Step ${props.current + 1} of ${props.steps.length} · ${props.steps[props.current]}`}
    </UKText>
  </div>
);

export default StepIndicator;
