import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createEffect, createResource, createSignal, Show } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";
import styles from "./LogoLink.module.scss";

/** where the square logo in the navigation rail leads when it is clicked */
const LogoLink: Component = () => {
  const [saved, { mutate }] = createResource(() => trpc.instance.branding.squareLogo.getLink.query(), {
    initialValue: { enabled: false, url: "" },
  });
  const [enabled, setEnabled] = createSignal(false);
  const [url, setUrl] = createSignal("");
  const [error, setError] = createSignal<string>();

  // the form follows what is saved, until it is edited
  createEffect(() => {
    setEnabled(saved().enabled);
    setUrl(saved().url);
  });

  const save = async (nextEnabled: boolean, nextUrl: string) => {
    setError(undefined);

    try {
      mutate(await trpc.instance.branding.squareLogo.setLink.mutate({ enabled: nextEnabled, url: nextUrl }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "The link could not be saved");
      setEnabled(saved().enabled);
      return false;
    }
  };

  return (
    <div class={styles.root}>
      <div class={styles.toggle}>
        <div class={styles.heading}>
          <UKText role="label" size="l">
            Open a link when clicked
          </UKText>
          <UKText role="body" size="s" class={styles.hint}>
            Clicking the logo in the navigation rail goes to this address.
          </UKText>
        </div>
        <UKSwitch
          value={enabled()}
          onValueChange={async (value) => {
            setEnabled(value);

            // turning it on needs an address first; turning it off keeps the address for later
            if (value && url().trim() === "") return;

            await save(value, url().trim());
          }}
        />
      </div>
      <Show when={enabled()}>
        <UKTextField label="Link" color="outlined" value={url()} onValueChange={setUrl} />
        <UKText role="body" size="s" class={styles.hint}>
          A full address such as https://example.com, or a path inside this workspace such as /app/uk.ewsgit.files.
        </UKText>
        <UKButton
          class={styles.save}
          affirmative
          onClick={async () => {
            const succeeded = await save(true, url().trim());

            return { state: succeeded ? AffirmativeButtonState.Success : AffirmativeButtonState.Error };
          }}
        >
          Save link
        </UKButton>
      </Show>
      <Show when={error()}>
        <UKText role="body" size="s" class={styles.error}>
          {error()}
        </UKText>
      </Show>
    </div>
  );
};

export default LogoLink;
