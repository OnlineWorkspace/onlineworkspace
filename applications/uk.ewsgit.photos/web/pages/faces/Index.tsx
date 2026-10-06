import LOCK_ICON from "@material-symbols/svg-700/outlined/lock.svg";
import TOGGLE_OFF_ICON from "@material-symbols/svg-700/outlined/toggle_off.svg";
import FACE_ICON from "@material-symbols/svg-700/outlined/face.svg";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, For, Show } from "solid-js";
import EmptyState from "../../components/EmptyState";
import Notice from "../../components/Notice";
import { pluralise } from "../../lib/format";
import { faceUrl } from "../../lib/media";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { createQuery } from "../../lib/useQuery";
import styles from "./Index.module.scss";

const FacesPage: Component = () => {
  const navigate = useNavigate();

  const people = createQuery(
    () => true,
    () => trpc.faces.list.query(),
  );

  const status = createQuery(
    () => true,
    () => trpc.faces.status.query(),
  );

  const emptyBody = () => {
    if (people.error()) return people.error();
    if (status.data() && !status.data()!.enabled) return "Facial recognition is not running, so there is nobody to show yet.";
    return "People found in your photos appear here once they have been scanned.";
  };

  return (
    <>
      <UKTopAppBar type="small" headline="Faces" />

      <Show when={status.data()?.allowedByInstance === false}>
        <Notice
          kind="instance"
          icon={LOCK_ICON}
          title="Facial recognition is turned off for this instance"
          body="An administrator has not allowed it, so it does not run for anyone, whatever your own setting is."
        />
      </Show>
      <Show when={status.data()?.allowedByInstance === true && status.data()?.enabledByUser === false}>
        <Notice
          kind="personal"
          icon={TOGGLE_OFF_ICON}
          title="Facial recognition is turned off for you"
          body="Turn it on in the Photos settings to start finding people in your photos."
          action={{ label: "Open settings", onClick: () => navigate("/app/uk.ewsgit.settings/applications/uk.ewsgit.photos") }}
        />
      </Show>

      <div class={styles.page}>
        <Show
          when={!people.loading()}
          fallback={
            <div class={styles.centered}>
              <UKCircularProgressIndicator />
            </div>
          }
        >
          <Show
            when={(people.data()?.people.length ?? 0) > 0}
            fallback={
              <EmptyState
                icon={FACE_ICON}
                title={people.error() ? "Could not load faces" : "No faces yet"}
                body={emptyBody()}
              />
            }
          >
            <div class={styles.grid}>
              <For each={people.data()?.people}>
                {(person) => (
                  <button type="button" class={styles.person} onClick={() => navigate(routes.person(person.id))}>
                    <img class={styles.face} src={faceUrl(person.faceId, 256)} alt="" loading="lazy" decoding="async" draggable={false} />
                    <UKText role="title" size="m" emphasized class={styles.name}>
                      {person.name ?? "Unnamed"}
                    </UKText>
                    <UKText role="body" size="m" class={styles.count}>
                      {pluralise(person.count, "photo")}
                    </UKText>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </>
  );
};

export default FacesPage;
