import type {Accessor, Component, Setter} from "solid-js";
import INDETERMINATE_QUESTION_BOX_ICON from "@material-symbols/svg-700/outlined/indeterminate_question_box.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.js";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.js";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.js";
import styles from "./MissingSearchResults.module.scss";

const MissingSearchResults: Component<{ searchQuery: Accessor<string>, setSearchQuery: Setter<string> }> = (props) => {
  return <div class={styles.missingResultsMessage}>
    <UKIcon class={styles.icon}>{INDETERMINATE_QUESTION_BOX_ICON}</UKIcon>
    <UKText role="title" size="l">
      No search results found
    </UKText>
    <UKText role="body" size="l">
      No apps were found which matched '{props.searchQuery()}'.
    </UKText>
    <UKButton
      class={styles.clearSearchButton}
      onClick={() => {
        props.setSearchQuery("");
      }}
    >
      Reset Search
    </UKButton>
  </div>;
}

export default MissingSearchResults;
