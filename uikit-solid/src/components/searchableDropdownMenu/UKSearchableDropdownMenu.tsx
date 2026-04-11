import { type Component, createEffect, createSignal } from "solid-js";
import UKMenu from "../menu/UKMenu.tsx";
import UKTextField from "../textField/UKTextField.tsx";
import styles from "./UKSearchableDropdownMenu.module.scss";

interface DropdownMenuItem {
  type: "button" | "divider";
  label: string;
  id: string;
}

const UKSearchableDropdownMenu: Component<{
  inputColor: "outlined" | "filled";
  label: string;
  items: DropdownMenuItem[];
  defaultValue?: string;
  onValueChange: (value: string) => void;
  inputLeadingIcon?: string;
  inputTrailingIcon?: string;
}> = (props) => {
  const [ref, setRef] = createSignal<HTMLDivElement | undefined>();
  const [query, setQuery] = createSignal<string>(props.defaultValue || "");
  const [showMenu, setShowMenu] = createSignal<false | { x: number; y: number }>(false);
  const [queriedItems, setQueriedItems] = createSignal<DropdownMenuItem[]>(props.items);

  createEffect(() => {
    setQueriedItems(
      props.items
        .map((i) => {
          if (i.type === "button") {
            if (i.id.toLowerCase().includes(query().toLowerCase().trim()) || i.label.toLowerCase().includes(query().toLowerCase().trim())) {
              return i;
            }
            return undefined;
          }
          if (i.type === "divider") {
            return i;
          }
        })
        .filter((i) => i !== undefined),
    );

    if (props.items.find((i) => i.id === query())) {
      props.onValueChange(query());
    } else if (props.items.find((i) => i.label.toLowerCase() === query().toLowerCase().trim())) {
      props.onValueChange(props.items.find((i) => i.label.toLowerCase() === query().toLowerCase().trim())!.id);
    } else {
      props.onValueChange("");
    }
  }, [query()]);

  createEffect(() => {
    const element = ref();

    if (!element) return;

    element.addEventListener("focusin", (e) => {
      e.preventDefault();

      // @ts-ignore
      const cr = element.getBoundingClientRect();

      setShowMenu({
        x: cr.left,
        y: cr.bottom,
      });
    });

    // element.addEventListener("focusout", (e) => {
    //   e.preventDefault();

    //   setShowMenu(false);
    // });
  });

  return (
    <div ref={setRef} class={styles.root}>
      <UKTextField
        class={styles.input}
        error={
          query() === ""
            ? false
            : queriedItems().find((i) => {
                return i?.type === "button" && (i as DropdownMenuItem).label.toLowerCase() === query().toLowerCase().trim();
              }) === undefined
        }
        color={"outlined"}
        label={props.label}
        defaultValue={query()}
        onValueChange={setQuery}
        value={query()}
        onEscape={() => setShowMenu(false)}
        leadingIcon={props.inputLeadingIcon ? { icon: props.inputLeadingIcon } : undefined}
        trailingIcon={props.inputTrailingIcon ? { icon: props.inputTrailingIcon } : undefined}
      />
      {showMenu() && (
        // <UKMenu
        //     class={styles.menu}
        //     items={queriedItems().map((i) => {
        //         if (i.type === SearchableDropdownMenuItemType.Button) {
        //             return {
        //                 ...i,
        //                 onClick() {
        //                     setQuery(i.label);
        //                     setIsFocussed(false);
        //                 },
        //             } as unknown as MenuButtonItem;
        //         }

        //         return i as unknown as MenuDividerItem;
        //     })}
        // />
        <UKMenu
          showMenu={showMenu}
          closeMenu={() => {
            setShowMenu(false);
          }}
          items={queriedItems().map((i) => {
            if (i.type === "button") {
              return {
                type: "button",
                label: i.label,
                onClick() {
                  setQuery(i.label);
                  setShowMenu(false);
                },
              };
            }

            return {
              type: "divider",
            };
          })}
        />
      )}
    </div>
  );
};

export default UKSearchableDropdownMenu;
