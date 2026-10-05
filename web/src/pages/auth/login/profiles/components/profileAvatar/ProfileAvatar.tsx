import {type Component, createSignal, Show} from "solid-js";
import backend from "../../../../../../lib/backend.ts";
import styles from "./ProfileAvatar.module.scss";

const ProfileAvatar: Component<{ username: string, displayName: string, class?: string }> = (props) => {
    const [failed, setFailed] = createSignal(false);

    return <div class={`${styles.root} ${props.class ?? ""}`}>
        <Show
            when={!failed()}
            fallback={<span class={styles.initial}>{props.displayName.charAt(0).toUpperCase()}</span>}
        >
            <img
                class={styles.image}
                draggable={false}
                alt={`${props.username}'s avatar`}
                src={backend(`/api/user/${props.username}/avatar/xl`)}
                onError={() => setFailed(true)}
            />
        </Show>
    </div>
}

export default ProfileAvatar;
