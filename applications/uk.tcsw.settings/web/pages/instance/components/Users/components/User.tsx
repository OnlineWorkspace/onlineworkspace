import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { createSignal, type Component } from "solid-js";
import styles from "./User.module.scss";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import UKSwitch from "@tcsw/uikit-solid/src/components/switch/UKSwitch.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";

const User: Component<{
    user: {
        id: number;
        username: string;
        fullName: {
            forename?: string | undefined;
            surname?: string | undefined;
        };
        isAdministrator: boolean;
        email?: string | undefined;
    };
}> = (props) => {
    const [username, setUsername] = createSignal<string>(props.user.username);
    const [email, setEmail] = createSignal<string>(props.user.email || "");
    const [forename, setForename] = createSignal<string>(props.user.fullName.forename || "");
    const [surname, setSurname] = createSignal<string>(props.user.fullName.surname || "");
    const [isAdministrator, setIsAdministrator] = createSignal<boolean>(props.user.isAdministrator);

    return (
        <UKStackItem
            leading={{ type: "icon", value: props.user.isAdministrator ? "shield_person" : "person" }}
            labelText={`${props.user.fullName.forename} ${props.user.fullName.surname || ""}`}
            supportingText={`(${props.user.id}) ${props.user.username}`}
            expandedComponent={
                <div class={styles.expanded}>
                    <UKTextField color="outlined" getValue={setUsername} defaultValue={username()} label="Username" />
                    <div class={styles.name}>
                        <UKTextField color="outlined" getValue={setForename} defaultValue={forename()} label="Forename" />
                        <UKTextField color="outlined" getValue={setSurname} defaultValue={surname()} label="Surname" />
                    </div>
                    <UKTextField color="outlined" getValue={setEmail} defaultValue={email()} label="Email" />
                    <div class={styles.boolean}>
                        <UKText role="label" size="m">
                            Is Administrator
                        </UKText>
                        <UKSwitch getValue={setIsAdministrator} value={isAdministrator()} />
                    </div>
                    <UKButton color={"tonal"} onClick={() => 0}>
                        Invalidate all sessions
                    </UKButton>
                    <UKButton color={"tonal"} onClick={() => 0}>
                        Force password reset
                    </UKButton>
                    <UKButton
                        color={"standard"}
                        onClick={() => {
                            // send a boop notification
                        }}
                    >
                        Boop
                    </UKButton>
                </div>
            }
        />
    );
};

export default User;
