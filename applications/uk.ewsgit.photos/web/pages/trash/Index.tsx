import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import type { Component } from "solid-js";
import CollectionPage from "../../components/CollectionPage";
import { usePhotos } from "../../lib/context";
import { routes } from "../../lib/routes";

const TrashPage: Component = () => {
  const photos = usePhotos();

  return (
    <CollectionPage
      title="Trash"
      query={{ scope: "trash" }}
      kind="trash"
      backTo={routes.albums()}
      note="Photos and videos stay here for 30 days, then they are deleted forever."
      empty={{ icon: DELETE_ICON, title: "Trash is empty", body: "Items you delete show up here before they are removed for good." }}
      trailing={
        (photos.counts()?.trash ?? 0) > 0 ? (
          <UKButton color="standard" onClick={photos.actions.emptyTrash}>
            Empty trash
          </UKButton>
        ) : undefined
      }
    />
  );
};

export default TrashPage;
