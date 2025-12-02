import { createSignal, Match, Suspense, Switch, type Component, type JSXElement } from "solid-js";
import styles from "./UKStackItem.module.scss";
import UKIcon from "../icon/UKIcon";
import UKText from "../text/UKText";

const UKStackItem: Component<{
    onClick?: () => void;
    onExpand?: () => void;
    onCollapse?: () => void;
    inlineComponent?: JSXElement;
    expandedComponent?: JSXElement;
    leading?: {
        type: "image" | "icon";
        value: string;
        alt?: string;
    };
    labelText?: string;
    supportingText?: string;
}> = (props) => {
    const [expanded, setExpanded] = createSignal<boolean>(false);

    if (!!props.expandedComponent && props.onClick) {
        console.error("Cannot have a UKStackItem with both expandedComponent & onClick");
        return <>Incompatable props, check console!</>;
    }

    if (!props.expandedComponent) {
        if (!!props.onExpand) {
            console.error("Cannot have a UKStackItem with onExpand without expandedComponent");
            return <>Incompatable props, check console!</>;
        }
        if (!!props.onCollapse) {
            console.error("Cannot have a UKStackItem with onCollapse without expandedComponent");
            return <>Incompatable props, check console!</>;
        }
    }

    return (
        <div class={styles.root}>
            <Switch>
                <Match when={!!props.onClick || !!props.expandedComponent}>
                    <button
                        class={styles.collapsedArea}
                        data-clickable={true}
                        onClick={
                            !!props.expandedComponent
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
                        {props.leading?.type === "icon" && <UKIcon class={styles.leadingIcon}>{props.leading.value}</UKIcon>}
                        {props.leading?.type === "image" && (
                            <img class={styles.leadingImage} src={props.leading.value} alt={props.leading.alt || ""} />
                        )}
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
                            {props.inlineComponent}
                        </Suspense>
                    </button>
                </Match>
                <Match when={!props.onClick}>
                    <div class={styles.collapsedArea} data-clickable={false}>
                        {props.leading?.type === "icon" && <UKIcon class={styles.leadingIcon}>{props.leading.value}</UKIcon>}
                        {props.leading?.type === "image" && (
                            <img class={styles.leadingImage} src={props.leading.value} alt={props.leading.alt || ""} />
                        )}
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
                            {props.inlineComponent}
                        </Suspense>
                    </div>
                </Match>
            </Switch>
            <Suspense>
                {expanded() && props.expandedComponent}
            </Suspense>
        </div>
    );
};

export default UKStackItem;
