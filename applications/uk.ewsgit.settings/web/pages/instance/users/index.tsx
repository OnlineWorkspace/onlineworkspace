import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKSearchBar from "@ewsgit/uikit-solid/src/components/searchBar/UKSearchBar.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, createSignal, For, Show, Suspense } from "solid-js";
import baseSettingsPageStyles from "../../../BaseSettingsPage.module.scss";
import trpc from "../../../lib/trpc.ts";
import CreateUser from "./components/CreateUser/CreateUser.tsx";
import User from "./components/User/User.tsx";
import styles from "./index.module.scss";

const ManageInstanceUsersPage: Component = () => {
  const navigate = useNavigate();
  const [users, { refetch: refetchUsers, mutate: mutateUsers }] = createResource(() => trpc.instance.getUsers.query());
  const [query, setQuery] = createSignal("");

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
        <div class={styles.page}>
          <div class={styles.header}>
            <div class={styles.heading}>
              <UKText role="title" size="l">
                Users
              </UKText>
              <Show when={users()}>
                <UKText role="body" size="m" class={styles.count}>
                  {users()?.length === 1 ? "1 user" : `${users()?.length} users`}
                </UKText>
              </Show>
            </div>
            <CreateUser updateUsers={() => refetchUsers()} />
          </div>
          <UKSearchBar value={query} onValueChange={setQuery} placeholder="Search by name, username or email" leadingIcon={SEARCH_ICON} />
          <Suspense fallback={<UKCircularProgressIndicator />}>
            <div class={styles.list}>
              <For each={users()}>
                {(userId) => (
                  <User
                    query={query()}
                    updateUsers={() => refetchUsers()}
                    userId={userId}
                    removeUser={() => mutateUsers((prevUsers) => prevUsers?.filter((u) => u !== userId))}
                  />
                )}
              </For>
            </div>
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default ManageInstanceUsersPage;
