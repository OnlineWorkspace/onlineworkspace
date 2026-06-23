import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import { type Component, createResource, For } from "solid-js";
import trpc from "../../../../lib/trpc";
import CreateUser from "./components/CreateUser/CreateUser";
import User from "./components/User/User";

const Users: Component = () => {
  const [users, { refetch: refetchUsers }] = createResource(() => trpc.instance.getUsers.query());

  return (
    <>
      <UKStackLabel>Instance Users</UKStackLabel>
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
