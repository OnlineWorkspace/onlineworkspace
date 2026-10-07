import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import VISIBILITY_ICON from "@material-symbols/svg-700/outlined/visibility.svg";
import VISIBILITY_OFF_ICON from "@material-symbols/svg-700/outlined/visibility_off.svg";
import { type Component, For, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import styles from "./ListEditors.module.scss";

export interface ArgRow {
  id: number;
  value: string;
}

export interface EnvRow {
  id: number;
  key: string;
  value: string;
  masked: boolean;
}

let nextId = 1;

export const argRows = (args: string[]): ArgRow[] => args.map((value) => ({ id: nextId++, value }));
// existing values are hidden until asked for, they are often secrets
export const envRows = (env: Record<string, string>): EnvRow[] => Object.entries(env).map(([key, value]) => ({ id: nextId++, key, value, masked: true }));

export const ArgsEditor: Component<{ rows: ArgRow[]; onChange: (rows: ArgRow[]) => void }> = (props) => {
  const [rows, setRows] = createStore<ArgRow[]>(props.rows);
  const emit = () => props.onChange(rows.map((r) => ({ ...r })));

  return (
    <div class={styles.root}>
      <UKText role="title" size="s">
        Arguments
      </UKText>
      <Show when={rows.length === 0}>
        <UKText role="body" size="s" class={styles.hint}>
          No arguments. Each one is passed to the program as is, there is no shell to split or expand them.
        </UKText>
      </Show>
      <For each={rows}>
        {(row, index) => (
          <div class={styles.row}>
            <UKTextField
              color="outlined"
              label={`Argument ${index() + 1}`}
              value={row.value}
              containerClass={styles.field}
              onValueChange={(value) => {
                setRows(index(), "value", value);
                emit();
              }}
            />
            <UKIconButton
              icon={CLOSE_ICON}
              alt={`Remove argument ${index() + 1}`}
              color="standard"
              onClick={() => {
                setRows(produce((list) => void list.splice(index(), 1)));
                emit();
              }}
            />
          </div>
        )}
      </For>
      <UKButton
        color="tonal"
        size="xs"
        leadingIcon={ADD_ICON}
        class={styles.add}
        onClick={() => {
          setRows(rows.length, { id: nextId++, value: "" });
          emit();
        }}
      >
        Add argument
      </UKButton>
    </div>
  );
};

export const EnvEditor: Component<{ rows: EnvRow[]; onChange: (rows: EnvRow[]) => void }> = (props) => {
  const [rows, setRows] = createStore<EnvRow[]>(props.rows);
  const emit = () => props.onChange(rows.map((r) => ({ ...r })));
  const invalid = (key: string) => key !== "" && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key);

  return (
    <div class={styles.root}>
      <UKText role="title" size="s">
        Environment variables
      </UKText>
      <Show when={rows.length === 0}>
        <UKText role="body" size="s" class={styles.hint}>
          None. The process inherits the environment of the server, with these added on top.
        </UKText>
      </Show>
      <For each={rows}>
        {(row, index) => (
          <div class={styles.row}>
            <UKTextField
              color="outlined"
              label="Name"
              value={row.key}
              error={invalid(row.key)}
              supportingText={invalid(row.key) ? "Letters, digits and underscores" : undefined}
              containerClass={styles.field}
              onValueChange={(value) => {
                setRows(index(), "key", value);
                emit();
              }}
            />
            <Show
              when={row.masked}
              fallback={
                <UKTextField
                  color="outlined"
                  label="Value"
                  value={row.value}
                  containerClass={styles.field}
                  onValueChange={(value) => {
                    setRows(index(), "value", value);
                    emit();
                  }}
                />
              }
            >
              <UKTextField
                color="outlined"
                label="Value"
                shouldMask
                value={row.value}
                containerClass={styles.field}
                onValueChange={(value) => {
                  setRows(index(), "value", value);
                  emit();
                }}
              />
            </Show>
            <UKIconButton
              icon={row.masked ? VISIBILITY_ICON : VISIBILITY_OFF_ICON}
              alt={row.masked ? "Show value" : "Hide value"}
              color="standard"
              onClick={() => setRows(index(), "masked", !row.masked)}
            />
            <UKIconButton
              icon={CLOSE_ICON}
              alt={`Remove ${row.key || "variable"}`}
              color="standard"
              onClick={() => {
                setRows(produce((list) => void list.splice(index(), 1)));
                emit();
              }}
            />
          </div>
        )}
      </For>
      <UKButton
        color="tonal"
        size="xs"
        leadingIcon={ADD_ICON}
        class={styles.add}
        onClick={() => {
          setRows(rows.length, { id: nextId++, key: "", value: "", masked: false });
          emit();
        }}
      >
        Add variable
      </UKButton>
    </div>
  );
};
