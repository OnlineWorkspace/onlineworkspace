import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DESKTOP_WINDOWS_ICON from "@material-symbols/svg-700/outlined/desktop_windows.svg";
import MOBILE_ICON from "@material-symbols/svg-700/outlined/mobile.svg";
import WEB_ICON from "@material-symbols/svg-700/outlined/web.svg";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import { AuthorizedDeviceType } from "@onlineworkspace/workspace-instance/src/systems/authorization";
import type { Component } from "solid-js";
import trpc from "../../../../../../lib/trpc";
import styles from "./Session.module.scss";

const ICON_FOR_DEVICE_TYPE: { [key in AuthorizedDeviceType]: string } = {
  [AuthorizedDeviceType.Desktop]: DESKTOP_WINDOWS_ICON,
  [AuthorizedDeviceType.Mobile]: MOBILE_ICON,
  [AuthorizedDeviceType.UnknownBrowser]: WEB_ICON,
};

const Session: Component<{
  sessionId: number;
  deviceType: AuthorizedDeviceType;
  firstLoginTimestamp: number;
  ipAddress: string;
  isCurrent: boolean;
  loginMethod: string;
  refetch: () => void;
}> = (props) => {
  return (
    <UKStackItem
      leading={{ type: "icon", value: ICON_FOR_DEVICE_TYPE[props.deviceType] }}
      inlineComponent={
        !props.isCurrent ? (
          <div class={styles.inlineComponent}>
            <UKIconButton
              icon={DELETE_ICON}
              alt={"Delete session"}
              color={"tonal"}
              onClick={async () => {
                await trpc.authentication.deleteSession.mutate({
                  sessionId: props.sessionId,
                });
                props.refetch();
              }}
            />
          </div>
        ) : null
      }
      labelText={`session #${props.sessionId}${props.isCurrent ? " (Current session)" : ""}`}
      supportingText={`Session Created on '${new Date(props.firstLoginTimestamp).toLocaleDateString("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric", year: "numeric" })}' from IP '${props.ipAddress}' using ${props.loginMethod}`}
    />
  );
};

export default Session;
