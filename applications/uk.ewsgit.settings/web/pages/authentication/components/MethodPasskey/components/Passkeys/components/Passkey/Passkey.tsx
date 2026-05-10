import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.jsx";
import type { Component } from "solid-js";
import trpc from "../../../../../../../../lib/trpc";
import styles from "./Passkey.module.scss";

const Passkey: Component<{
  id: string;
  creationTimestamp: string;
  lastUsedTimestamp: string;
  deviceType: string;
  usedTimes: string;
  refetchPasskeys: () => void;
}> = (props) => {
  return (
    <div class={styles.root}>
      <div class={styles.info}>
        <UKText role="title" size="m">
          {`ID: ${props.id}`}
        </UKText>
        <UKText role="body" size="m">
          {`Used: ${props.usedTimes} time(s)`}
          <br />
          {`Created: ${(new Date(props.creationTimestamp)).toLocaleString()}. Last used: ${(new Date(props.lastUsedTimestamp)).toLocaleString()}`}
        </UKText>
      </div>
      <UKIconButton
        icon={DELETE_ICON}
        color="tonal"
        alt="delete passkey"
        onClick={async () => {
          await trpc.authentication.removePasskey.mutate({ id: props.id });
          props.refetchPasskeys();
        }}
      ></UKIconButton>
    </div>
  );
};

export default Passkey;
