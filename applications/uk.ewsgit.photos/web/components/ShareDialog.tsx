import CONTENT_COPY_ICON from "@material-symbols/svg-700/outlined/content_copy.svg";
import LINK_OFF_ICON from "@material-symbols/svg-700/outlined/link_off.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createResource, Match, Switch } from "solid-js";
import { errorMessage, shareUrl } from "../lib/media";
import trpc from "../lib/trpc";
import type { ShareTarget } from "../lib/types";
import styles from "./ShareDialog.module.scss";

/** The content of the share dialog: anyone with the link can see the album or photo, until the link is turned off. */
const ShareDialog: Component<{ target: ShareTarget; onClose: () => void; notify: (message: string) => void; onChanged: () => void }> = (props) => {
  const [share] = createResource(async () => {
    try {
      return { link: await trpc.shares.create.mutate(props.target) };
    } catch (error) {
      return { error: errorMessage(error) };
    }
  });

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      props.notify("Link copied");
    } catch {
      props.notify("Could not copy the link, select it and copy it by hand");
    }
  };

  const stop = async (id: number) => {
    try {
      await trpc.shares.revoke.mutate({ id });
      props.onChanged();
      props.notify("Sharing turned off");
      props.onClose();
    } catch (error) {
      props.notify(errorMessage(error));
    }
  };

  return (
    <div class={styles.root}>
      <UKText role="title" size="l">
        Share
      </UKText>

      <Switch>
        <Match when={share.loading}>
          <UKCircularProgressIndicator class={styles.spinner} />
        </Match>

        <Match when={share()?.error}>
          <UKText role="body" size="l">
            {share()?.error}
          </UKText>
          <div class={styles.buttons}>
            <UKButton color="standard" onClick={props.onClose}>
              Close
            </UKButton>
          </div>
        </Match>

        <Match when={share()?.link}>
          {(() => {
            const link = () => share()!.link!;

            return (
              <>
                <UKText role="body" size="m" class={styles.muted}>
                  Anyone with this link can view {props.target.albumId === undefined ? "this photo" : "this album"}. Turn sharing off at any time.
                </UKText>
                <UKTextField color="outlined" label="Link" defaultValue={shareUrl(link().token)} onValueChange={() => undefined} />
                <div class={styles.buttons}>
                  <UKButton color="standard" leadingIcon={LINK_OFF_ICON} onClick={() => stop(link().id)}>
                    Stop sharing
                  </UKButton>
                  <UKButton color="filled" leadingIcon={CONTENT_COPY_ICON} onClick={() => copy(link().token)}>
                    Copy link
                  </UKButton>
                </div>
              </>
            );
          })()}
        </Match>
      </Switch>
    </div>
  );
};

export default ShareDialog;
