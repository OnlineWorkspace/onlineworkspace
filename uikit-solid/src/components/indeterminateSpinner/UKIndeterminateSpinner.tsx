import clsx from "clsx";
import type { Component } from "solid-js";
import spinnerImage from "./spinner.svg";
import styles from "./UKIndeterminateSpinner.module.scss";

const UKIndeterminateSpinner: Component<{ class?: string; centerSelf?: boolean }> = (props) => {
  return (
    <div class={clsx(styles.root, props.class, props.centerSelf && styles.centerSelf)}>
      <img class={styles.image} alt={""} src={spinnerImage} />
    </div>
  );
};

export default UKIndeterminateSpinner;
