import type {Component} from "solid-js"
import styles from "./Session.module.scss"
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx"
import {AuthorizedDeviceType} from "../../../../../../../../../instance/src/subsystems/authorization";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import trpc from "../../../../../../lib/trpc";

const ICON_FOR_DEVICE_TYPE: {[ key in AuthorizedDeviceType ]: string} = {
    [ AuthorizedDeviceType.Desktop ]: "desktop_windows",
    [ AuthorizedDeviceType.Mobile ]: "mobile",
    [ AuthorizedDeviceType.UnknownBrowser ]: "web",
}

const Session: Component<{
    sessionId: number;
    deviceType: AuthorizedDeviceType;
    firstLoginTimestamp: number;
    ipAddress: string;
    isCurrent: boolean;
    refetch: () => void;
}> = (props) => {
    return (
        <UKStackItem
            leading={{ type: "icon", value: ICON_FOR_DEVICE_TYPE[props.deviceType] }}
            inlineComponent={
                <div class={styles.inlineComponent}>
                    <UKIconButton
                        icon={"delete"}
                        alt={"Delete session"}
                        color={"tonal"}
                        onClick={async () => {
                            await trpc.authentication.deleteSession.mutate({ sessionId: props.sessionId });
                            props.refetch();
                        }}
                    />
                </div>
            }
            labelText={`session #${props.sessionId}${props.isCurrent ? " (Current session)" : ""}`}
            supportingText={`Session Created on ${new Date(props.firstLoginTimestamp).toLocaleDateString("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric", year: "numeric" })} from ${props.ipAddress}`}
        />
    );
};

export default Session