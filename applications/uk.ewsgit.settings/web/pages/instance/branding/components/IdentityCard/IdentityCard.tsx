import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal } from "solid-js";
import styles from "./IdentityCard.module.scss";

/** the text that names the workspace: shown on the login page, in the tab title and to search engines */
const IdentityCard: Component = () => {
  const [displayName, setDisplayName] = createSignal("");
  const [tagline, setTagline] = createSignal("");
  const [metaDescription, setMetaDescription] = createSignal("");

  return (
    <UKCard class={styles.root}>
      <div class={styles.field}>
        <UKTextField label="Display name" color="outlined" value={displayName()} onValueChange={setDisplayName} />
        <UKText role="body" size="s" class={styles.hint}>
          The name of your workspace, shown at the bottom of the login page and in the tab title.
        </UKText>
      </div>
      <div class={styles.field}>
        <UKTextField label="Tagline" color="outlined" value={tagline()} onValueChange={setTagline} />
        <UKText role="body" size="s" class={styles.hint}>
          A short phrase describing your organization, shown at the bottom of the login page.
        </UKText>
      </div>
      <div class={styles.field}>
        <UKTextField as="textarea" label="Meta description" color="outlined" value={metaDescription()} onValueChange={setMetaDescription} />
        <UKText role="body" size="s" class={styles.hint}>
          Used for SEO and may be shown in search engine results.
        </UKText>
      </div>
      <UKButton
        class={styles.save}
        affirmative
        onClick={async () => {
          return { state: AffirmativeButtonState.Success };
        }}
      >
        Save
      </UKButton>
    </UKCard>
  );
};

export default IdentityCard;
