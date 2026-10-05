import type {Component} from "solid-js";
import {Show} from "solid-js";
import ProfileAvatar from "../profileAvatar/ProfileAvatar.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import PERSON_ADD_ICON from "@material-symbols/svg-700/outlined/person_add.svg";
import styles from "./Profile.module.scss";

const Profile: Component<{
    username?: string, displayName?: string, add?: boolean, select: () => void
}> = (props) => {
    return <button class={styles.component} role={"listitem"} onClick={props.select}>
        <div class={styles.tile} data-add={props.add || false}>
            <Show
                when={!props.add}
                fallback={<UKIcon icon={PERSON_ADD_ICON} alt={"Sign up"}/>}
            >
                <ProfileAvatar class={styles.avatar} username={props.username!} displayName={props.displayName ?? props.username!}/>
            </Show>
        </div>
        <UKText role={"title"} size={"m"} align={"center"} class={styles.name}>
            {props.add ? "Create account" : props.displayName}
        </UKText>
    </button>
}

export default Profile;
