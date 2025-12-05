import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import {createResource, For, type Component} from "solid-js";
import instanceStyles from "./../../Index.module.scss"
import trpc from "../../../../lib/trpc";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import User from "./components/User";

const Users: Component = () => {
    const [ users ] = createResource(() => trpc.instance.getUsers.query())

    return (
        <>
            <UKText class={instanceStyles.subheading} role="title" size="m" align="start">
                Instance Users
            </UKText>
            <UKStack>
                <For each={users()}>
                    {(userId) => {
                        return <User userId={userId} />;
                    }}
                </For>
            </UKStack>
        </>
    );
}

export default Users