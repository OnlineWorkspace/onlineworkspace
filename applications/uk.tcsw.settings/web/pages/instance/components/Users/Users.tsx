import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { createResource, For, type Component } from "solid-js";
import instanceStyles from "./../../Index.module.scss";
import trpc from "../../../../lib/trpc";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import User from "./components/User/User";
import CreateUser from "./components/CreateUser/CreateUser";

const Users: Component = () => {
    const [users, { refetch: refetchUsers }] = createResource(() => trpc.instance.getUsers.query());

    return (
        <>
            <UKText class={instanceStyles.subheading} role="title" size="m" align="start">
                Instance Users
            </UKText>
            <UKStack>
                <For each={users()}>
                    {(userId) => {
                        return <User updateUsers={() => refetchUsers()} userId={userId} />;
                    }}
                </For>
            </UKStack>
            <CreateUser updateUsers={() => refetchUsers()} />
        </>
    );
};

export default Users;
