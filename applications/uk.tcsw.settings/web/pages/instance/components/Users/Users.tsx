import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { createResource, For, type Component } from "solid-js";
import instanceStyles from "./../../Index.module.scss";
import trpc from "../../../../lib/trpc";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import User from "./components/User";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";

const Users: Component = () => {
    const [users] = createResource(() => trpc.instance.getUsers.query());

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
            <UKStack>
                <UKStackItem labelText="Create user" expandedComponent={<div>Create user</div>} />
            </UKStack>
        </>
    );
};

export default Users;
