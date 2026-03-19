import { createResource, For, type Component } from "solid-js";
import trpc from "../../../../lib/trpc";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import User from "./components/User/User";
import CreateUser from "./components/CreateUser/CreateUser";
import UKStackLabel from "@tcsw/uikit-solid/src/components/stack/UKStackLabel.tsx";

const Users: Component = () => {
  const [users, { refetch: refetchUsers }] = createResource(() =>
    trpc.instance.getUsers.query(),
  );

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
