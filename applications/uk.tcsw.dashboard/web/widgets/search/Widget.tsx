import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import { type Component, createSignal } from "solid-js";
import styles from "./Widget.module.scss";
import SEARCH_ICON from "@material-symbols/svg-500/outlined/search.svg?url"

const Widget: Component = () => {
  const [searchQuery, setSearchQuery] = createSignal<string>("");

  return (
    <div class={styles.root}>
      <UKTextField
        containerClass={styles.input}
        label="Search Query"
        getValue={setSearchQuery}
        setValue={searchQuery()}
        color="outlined"
      />
      <UKIconButton
        class={styles.button}
        icon={SEARCH_ICON}
        color="filled"
        alt="Search"
        size="m"
        shape="square"
        width="default"
        onClick={() => {
          window.open(`https://duckduckgo.com/?q=${encodeURIComponent(searchQuery())}`, "_blank");
        }}
      />
    </div>
  );
};

export default Widget;
