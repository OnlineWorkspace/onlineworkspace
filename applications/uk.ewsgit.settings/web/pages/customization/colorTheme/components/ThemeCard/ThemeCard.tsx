import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import type { Component } from "solid-js";
import { Show } from "solid-js";
import ThemeMock from "../ThemeMock/ThemeMock.tsx";
import styles from "./ThemeCard.module.scss";

const ThemeCard: Component<{ name: string; colors: Record<string, string>; selected: boolean; onClick(): void }> = (props) => {
  return (
    <button type="button" class={styles.root} data-selected={props.selected} aria-pressed={props.selected} onClick={props.onClick}>
      <ThemeMock colors={props.colors} />
      <div class={styles.label}>
        <UKText role="label" size="l">
          {props.name}
        </UKText>
        <Show when={props.selected}>
          <UKIcon>{CHECK_ICON}</UKIcon>
        </Show>
      </div>
    </button>
  );
};

export default ThemeCard;
