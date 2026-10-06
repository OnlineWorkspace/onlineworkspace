import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createEffect, createResource, createSignal, Show } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";
import styles from "./IdentityCard.module.scss";

/** the text that names the workspace: shown on the login page, in the tab title and to search engines */
const IdentityCard: Component = () => {
  const [saved, { mutate }] = createResource(() => trpc.instance.branding.getIdentity.query());
  const [displayName, setDisplayName] = createSignal("");
  const [tagline, setTagline] = createSignal("");
  const [metaDescription, setMetaDescription] = createSignal("");
  const [error, setError] = createSignal<string>();

  // the fields start from what is saved
  createEffect(() => {
    const identity = saved();

    if (!identity) return;

    setDisplayName(identity.displayName);
    setTagline(identity.tagline);
    setMetaDescription(identity.metaDescription);
  });

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
          setError(undefined);

          try {
            mutate(
              await trpc.instance.branding.setIdentity.mutate({
                displayName: displayName(),
                tagline: tagline(),
                metaDescription: metaDescription(),
              }),
            );

            return { state: AffirmativeButtonState.Success };
          } catch (err) {
            setError(err instanceof Error ? err.message : "The changes could not be saved");

            return { state: AffirmativeButtonState.Error };
          }
        }}
      >
        Save
      </UKButton>
      <Show when={error()}>
        <UKText role="body" size="s" class={styles.error}>
          {error()}
        </UKText>
      </Show>
    </UKCard>
  );
};

export default IdentityCard;
