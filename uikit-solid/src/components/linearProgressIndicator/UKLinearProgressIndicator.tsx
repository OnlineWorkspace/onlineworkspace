import { type Component, createEffect, createSignal } from "solid-js";
import styles from "./UKLinearProgressIndicator.module.scss";

const UKLinearProgressIndicator: Component<{ start: number; stop: number; value: number; thickness?: number }> = (props) => {
  const [percentageCompletion, setPercentageCompletion] = createSignal<number>(45);

  createEffect(() => {
    const range = props.stop - props.start;

    if (range === 0) {
      setPercentageCompletion(0);
      return;
    }

    setPercentageCompletion(Math.min(Math.max(((props.value - props.start) / range) * 100, 0), 100));
  });

  return (
    <div class={styles.root} style={{ ...(props.thickness ? { "--thickness": `${props.thickness}px` } : {}) }}>
      <div class={styles.activeIndicator} style={{ width: `${percentageCompletion()}%` }}></div>
      <div
        class={styles.remainingIndicator}
        style={{
          width: `calc(${100 - percentageCompletion()}% - ${percentageCompletion() > 5 ? "0.25rem" : "0px"})`,
          "margin-left": percentageCompletion() <= 5 ? "0px" : "0.25rem",
        }}
      >
        <div class={styles.stopIndicator}></div>
      </div>
    </div>
  );
};

export default UKLinearProgressIndicator;
