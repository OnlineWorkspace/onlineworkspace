import CHEVRON_RIGHT_ICON from "@material-symbols/svg-700/outlined/chevron_right.svg";
import clsx from "clsx";
import { type Component, createSignal, type JSXElement, Match, Show, Suspense, Switch } from "solid-js";
import UKIcon from "../icon/UKIcon";
import UKIconButton from "../iconButton/UKIconButton.tsx";
import UKText from "../text/UKText";
import styles from "./UKStackItem.module.scss";

interface LeadingIconOrImage {
  type: "image" | "icon";
  value: string;
  alt?: string;
}

interface LeadingIconButton {
  type: "iconButton";
  value: string;
  alt: string;
  onClick: () => void;
}

const UKStackItem: Component<{
  onClick?: () => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  inlineComponent?: JSXElement;
  expandedComponent?: JSXElement;
  defaultExpanded?: boolean;
  leading?: LeadingIconOrImage | LeadingIconButton;
  labelText?: string;
  supportingText?: string;
}> = (props) => {
  const [expanded, setExpanded] = createSignal<boolean>(props.defaultExpanded ?? false);

  if (!!props.expandedComponent && props.onClick) {
    console.error("Cannot have a UKStackItem with both expandedComponent & onClick");
    return <>Incompatible props, check console!</>;
  }

  if (!props.expandedComponent) {
    if (props.onExpand) {
      console.error("Cannot have a UKStackItem with onExpand without expandedComponent");
      return <>Incompatible props, check console!</>;
    }
    if (props.onCollapse) {
      console.error("Cannot have a UKStackItem with onCollapse without expandedComponent");
      return <>Incompatible props, check console!</>;
    }
  }

  return (
    <div class={styles.root}>
      <Switch>
        <Match when={!!props.onClick || !!props.expandedComponent}>
          <button
            type={"button"}
            class={styles.collapsedArea}
            data-clickable={true}
            onClick={
              props.expandedComponent
                ? () => {
                    if (expanded()) {
                      props.onCollapse?.();
                    } else {
                      props.onExpand?.();
                    }

                    setExpanded((exp) => !exp);
                  }
                : props.onClick
            }
          >
            {props.leading?.type === "iconButton" && <UKIconButton alt={props.leading.alt} onClick={props.leading.onClick} icon={props.leading.value} />}
            {props.leading?.type === "icon" && <UKIcon class={styles.leadingIcon}>{props.leading.value}</UKIcon>}
            {props.leading?.type === "image" && <img class={styles.leadingImage} src={props.leading.value} alt={props.leading.alt || ""} />}
            {(props.labelText || props.supportingText) && (
              <div class={styles.body}>
                <Suspense
                  fallback={
                    <UKText role={"label"} size={"l"} class={styles.labelText}>
                      ...
                    </UKText>
                  }
                >
                  {props.labelText && (
                    <UKText role={"label"} size={"l"} class={styles.labelText}>
                      {props.labelText}
                    </UKText>
                  )}
                </Suspense>
                <Suspense
                  fallback={
                    <UKText role={"body"} size={"m"} class={styles.supportingText}>
                      ...
                    </UKText>
                  }
                >
                  {props.supportingText && (
                    <UKText role={"body"} size={"m"} class={styles.supportingText}>
                      {props.supportingText}
                    </UKText>
                  )}
                </Suspense>
              </div>
            )}
            <Suspense>
              {props.inlineComponent
                ? props.inlineComponent
                : !!props.expandedComponent && (
                    <UKIcon class={clsx(expanded() ? styles.indicatorExpanded : styles.indicatorCollapsed, styles.toggleIndicator)}>
                      {CHEVRON_RIGHT_ICON}
                    </UKIcon>
                  )}
            </Suspense>
          </button>
        </Match>
        <Match when={!props.onClick}>
          <div class={styles.collapsedArea} data-clickable={false}>
            {props.leading?.type === "icon" && <UKIcon class={styles.leadingIcon}>{props.leading.value}</UKIcon>}
            {props.leading?.type === "image" && <img class={styles.leadingImage} src={props.leading.value} alt={props.leading.alt || ""} />}
            {(props.labelText || props.supportingText) && (
              <div class={styles.body}>
                <Suspense
                  fallback={
                    <UKText role={"label"} size={"l"} class={styles.labelText}>
                      ...
                    </UKText>
                  }
                >
                  {props.labelText && (
                    <UKText role={"label"} size={"l"} class={styles.labelText}>
                      {props.labelText}
                    </UKText>
                  )}
                </Suspense>
                <Suspense
                  fallback={
                    <UKText role={"body"} size={"m"} class={styles.supportingText}>
                      ...
                    </UKText>
                  }
                >
                  {props.supportingText && (
                    <UKText role={"body"} size={"m"} class={styles.supportingText}>
                      {props.supportingText}
                    </UKText>
                  )}
                </Suspense>
              </div>
            )}
            <Suspense>{props.inlineComponent}</Suspense>
          </div>
        </Match>
      </Switch>
      <Show when={expanded()}>{props.expandedComponent}</Show>
    </div>
  );
};

export default UKStackItem;
