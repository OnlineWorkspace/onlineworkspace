import { type Component, createEffect, createSignal } from "solid-js";
import UKTextField from "../textField/UKTextField.tsx";
import UKMenu from "../menu/UKMenu.tsx";
import { type SearchableDropDownMenuButtonItem, type SearchableDropdownMenuItems, SearchableDropdownMenuItemType } from "./lib/items.ts";
import type { MenuButtonItem, MenuDividerItem } from "../menu/lib/items.ts";
import styles from "./UKSearchableDropdownMenu.module.scss";

const UKSearchableDropdownMenu: Component<{
    inputColor: "outlined" | "filled";
    label: string;
    items: SearchableDropdownMenuItems;
    defaultValue?: string;
    getValue: (value: string) => void;
    inputLeadingIcon?: string;
    inputTrailingIcon?: string;
}> = (props) => {
    const [query, setQuery] = createSignal<string>("");
    const [isFocussed, setIsFocussed] = createSignal<boolean>(false);
    const [queriedItems, setQueriedItems] = createSignal<SearchableDropdownMenuItems>(props.items);

    createEffect(() => {
        setQueriedItems(
            props.items
                .map((i) => {
                    if (i.type === SearchableDropdownMenuItemType.Button) {
                        if (i.label.toLowerCase().includes(query().toLowerCase().trim())) {
                            return i;
                        }
                        return undefined;
                    }
                    if (i.type === SearchableDropdownMenuItemType.Divider) {
                        return i;
                    }
                })
                .filter((i) => i !== undefined),
        );

        props.getValue(query());
    }, [query()]);

    return (
        <div class={styles.root}>
            <UKTextField
                class={styles.input}
                error={
                    query() === ""
                        ? false
                        : queriedItems().find((i) => {
                              return (
                                  i?.type === SearchableDropdownMenuItemType.Button &&
                                  (i as SearchableDropDownMenuButtonItem).label.toLowerCase() === query().toLowerCase().trim()
                              );
                          }) === undefined
                }
                color={"outlined"}
                label={props.label}
                defaultValue={query()}
                getValue={setQuery}
                onFocus={() => setIsFocussed(true)}
                forceFocussed={isFocussed()}
                setValue={query()}
                onEscape={() => setIsFocussed(false)}
                leadingIcon={props.inputLeadingIcon ? { icon: props.inputLeadingIcon } : undefined}
                trailingIcon={props.inputTrailingIcon ? { icon: props.inputTrailingIcon } : undefined}
            />
            {isFocussed() && (
                <UKMenu
                    class={styles.menu}
                    items={queriedItems().map((i) => {
                        if (i.type === SearchableDropdownMenuItemType.Button) {
                            return {
                                ...i,
                                onClick() {
                                    setQuery(i.label);
                                    setIsFocussed(false);
                                },
                            } as unknown as MenuButtonItem;
                        }

                        return i as unknown as MenuDividerItem;
                    })}
                />
            )}
            {isFocussed() && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsFocussed(false);

                            let a = document.elementFromPoint(e.clientX, e.clientY);
                            // @ts-ignore
                            a?.focus?.();
                            // @ts-ignore
                            a?.click?.();
                        }
                    }}
                    class={styles.outside}
                />
            )}
        </div>
    );
};

export default UKSearchableDropdownMenu;
