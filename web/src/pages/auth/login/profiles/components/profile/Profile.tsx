import type {Component} from "solid-js";
import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.tsx";
import backend from "../../../../../../lib/backend.ts";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import styles from "./Profile.module.scss";
import clsx from "clsx";

const Profile: Component<{
    username: string, displayName: string, selected: boolean, select: () => void, anySelected: boolean
}> = (props) => {
    return <button
        class={clsx(styles.component, (props.anySelected && !props.selected) && styles.otherProfileSelected)}
        onClick={props.select}
    >
        <UKAvatar
            size={props.selected ? "xl" : "l"}
            username={props.username}
            avatar={backend(`/api/user/${props.username}/avatar/${props.selected ? "xl" : "l"}`)}
        />
        <UKText
            class={styles.text}
            role={props.selected ? "title" : "body"}
            size={"l"}
            align={"center"}
            emphasized={props.selected}
        >
            {props.displayName}
        </UKText>
    </button>
}

export default Profile;