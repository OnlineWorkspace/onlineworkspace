import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import { createSignal, type Component } from "solid-js";
import styles from "./CreateUser.module.scss";
import trpc from "../../../../../../lib/trpc";

const CreateUser: Component<{ updateUsers: () => void }> = (props) => {
    const [username, setUsername] = createSignal<string>("");

    return (
        <UKStack>
            <UKStackItem
                labelText="Create user"
                expandedComponent={
                    <div class={styles.expanded}>
                        <UKTextField color={"outlined"} label={"Username"} getValue={setUsername} defaultValue={username()} />
                        <UKButton
                            onClick={async () => {
                                await trpc.instance.createUser.mutate({ username: username() });
                                props.updateUsers();
                                setUsername("");
                            }}
                        >
                            Create User
                        </UKButton>
                    </div>
                }
            />
        </UKStack>
    );
};

export default CreateUser;
