import { createSignal, onCleanup, onMount, type Accessor, type Component, type JSXElement } from "solid-js";
import styles from "./UKTopAppBar.module.scss";
import UKIconButton from "../iconButton/UKIconButton";
import UKText from "../text/UKText";

interface ISharedProps {
    leadingButton?: { icon: string; accessibleLabel: string; onClick(): void };
    trailingElements?: JSXElement;
}

const UKTopAppBar: Component<
    | (ISharedProps & {
          type: "search";
          value: Accessor<string>;
          placeholder: string;
      } & (
              | {
                    getValue: (value: string) => void;
                    getValueOnSubmit: (value: string) => void;
                }
              | {
                    getValue: (value: string) => void;
                }
              | {
                    getValueOnSubmit: (value: string) => void;
                }
          ))
    | (ISharedProps & {
          type: "small";
      } & (
              | {
                    textAlignment?: "center" | "start";
                    headline?: string;
                    subtitle?: string;
                }
              | {
                    titleImage: string;
                    titleImageAccessibleLabel: string;
                }
          ))
    | (ISharedProps & {
          type: "medium";
          textAlignment?: "center" | "start";
          headline?: string;
          subtitle?: string;
      })
    | (ISharedProps & {
          type: "large";
          textAlignment?: "center" | "start";
          headline?: string;
          subtitle?: string;
      })
> = (props) => {
    let ref!: HTMLDivElement;

    const [scrolled, setScrolled] = createSignal<boolean>(false);

    const scrollListener = () => {
        if (ref.parentElement!.scrollTop > 0) {
            setScrolled(true);
        } else {
            setScrolled(false);
        }
    };

    onMount(() => {
        const parentElement = ref.parentElement;

        if (parentElement?.scrollTop !== undefined && parentElement?.scrollTop > 0) {
            setScrolled(true);
        }

        parentElement?.addEventListener("scroll", scrollListener);
    });

    onCleanup(() => {
        const parentElement = ref.parentElement;
        parentElement?.removeEventListener("scroll", scrollListener);
    });

    return (
        <>
            <div
                ref={ref}
                class={styles.root}
                data-type={props.type}
                data-text-align={"textAlignment" in props && props.textAlignment}
                data-scrolled={scrolled()}
            >
                <div class={styles.topAppBar}>
                    {props.leadingButton && (
                        <UKIconButton
                            class={styles.leadingIcon}
                            alt={props.leadingButton.accessibleLabel}
                            icon={props.leadingButton.icon}
                            onClick={props.leadingButton.onClick}
                            color={"standard"}
                        />
                    )}
                    {props.type === "small" && "titleImage" in props ? (
                        <img src={props.titleImage} alt={props.titleImageAccessibleLabel} />
                    ) : props.type !== "search" ? (
                        <div class={styles.titleContainer}>
                            <div class={styles.title}>
                                {"headline" in props && (
                                    <UKText
                                        align={("textAlignment" in props && props.textAlignment) || "start"}
                                        class={styles.headline}
                                        size="l"
                                        role={"title"}
                                    >
                                        {props.headline}
                                    </UKText>
                                )}
                                {"subtitle" in props && (
                                    <UKText
                                        align={("textAlignment" in props && props.textAlignment) || "start"}
                                        class={styles.subtitle}
                                        size="m"
                                        role={"label"}
                                    >
                                        {props.subtitle}
                                    </UKText>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div class={styles.searchBar}>
                            <UKText class={styles.placeholder} size={"l"} role={"label"} align={"center"}>
                                {props.placeholder}
                            </UKText>
                            <input
                                type="text"
                                placeholder={" "}
                                value={props.value()}
                                onInput={(e) => {
                                    if ("getValue" in props) {
                                        props.getValue(e.currentTarget.value);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        "getValueOnSubmit" in props &&
                                        typeof props.getValueOnSubmit === "function"
                                    ) {
                                        props.getValueOnSubmit(e.currentTarget.value);
                                    }
                                }}
                            ></input>
                        </div>
                    )}
                    <div class={styles.trailing}>{props.trailingElements}</div>
                </div>
            </div>
            <div class={styles.scrolledSpacerElement} />
        </>
    );
};

export default UKTopAppBar;
