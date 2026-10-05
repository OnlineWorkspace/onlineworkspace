import clsx from "clsx";
import type { Component } from "solid-js";
import styles from "./ThemeMock.module.scss";

/** A tiny app window painted with the given scheme colors (as "r, g, b" strings), independent of the active theme. */
const ThemeMock: Component<{ colors: Record<string, string>; class?: string }> = (props) => {
  const c = (key: string) => `rgb(${props.colors[key] ?? "0, 0, 0"})`;

  return (
    <div class={clsx(styles.root, props.class)} style={{ background: c("background") }}>
      <div class={styles.sidebar} style={{ background: c("surface-container") }}>
        <div class={styles.dot} style={{ background: c("on-surface-variant") }} />
        <div class={styles.navActive} style={{ background: c("secondary-container") }} />
        <div class={styles.nav} style={{ background: c("on-surface-variant") }} />
        <div class={styles.nav} style={{ background: c("on-surface-variant") }} />
      </div>
      <div class={styles.content}>
        <div class={styles.title} style={{ background: c("on-surface") }} />
        <div class={styles.card} style={{ background: c("primary-container") }} />
        <div class={styles.row}>
          <div class={styles.line} style={{ background: c("on-surface-variant") }} />
          <div class={styles.button} style={{ background: c("primary") }} />
        </div>
      </div>
    </div>
  );
};

export default ThemeMock;
