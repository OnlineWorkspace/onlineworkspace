import { type Component, createResource, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import trpc from "../../../lib/trpc.ts";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import User from "./components/User/User.tsx";
import CreateUser from "./components/CreateUser/CreateUser.tsx";
import baseSettingsPageStyles from "../../../BaseSettingsPage.module.scss";

const ManageInstanceUsersPage: Component = () => {
  const navigate = useNavigate();
  const [users, { refetch: refetchUsers, mutate: mutateUsers }] =
    createResource(() => trpc.instance.getUsers.query());

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Manage Instance Users"}
        subtitle={"Caution: Advanced users only, change at your own risk."}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={baseSettingsPageStyles.baseSettingsPageContent}>
        <UKStackLabel>Instance Users</UKStackLabel>
        <UKStack>
          <For each={users()}>
            {(userId) => {
              return (
                <User
                  updateUsers={() => refetchUsers()}
                  userId={userId}
                  removeUser={() =>
                    mutateUsers((prevUsers) =>
                      prevUsers!.filter((u) => u !== userId)
                    )}
                />
              );
            }}
          </For>
        </UKStack>
        <CreateUser updateUsers={() => refetchUsers()} />
      </div>
    </>
  );
};

export default ManageInstanceUsersPage;
