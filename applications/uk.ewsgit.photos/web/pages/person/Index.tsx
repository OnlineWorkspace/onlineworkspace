import EDIT_ICON from "@material-symbols/svg-700/outlined/edit.svg";
import FACE_ICON from "@material-symbols/svg-700/outlined/face.svg";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import { Navigate, useParams } from "@solidjs/router";
import type { Component } from "solid-js";
import CollectionPage from "../../components/CollectionPage";
import { usePhotos } from "../../lib/context";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { createQuery } from "../../lib/useQuery";

const PersonPage: Component = () => {
  const params = useParams();
  const photos = usePhotos();

  const personId = () => {
    const id = Number(params.id);
    return Number.isInteger(id) && id > 0 ? id : undefined;
  };

  const person = createQuery(personId, (id) => trpc.faces.get.query({ id }));

  const rename = () => {
    const id = personId();
    if (id === undefined) return;

    photos.actions.renamePerson(id, person.data()?.name ?? "");
  };

  return (
    <>
      {personId() === undefined && <Navigate href={routes.faces()} />}

      <CollectionPage
        title={person.data()?.name ?? "Unnamed"}
        query={personId() === undefined ? undefined : { scope: "person", personId: personId() }}
        kind="library"
        backTo={routes.faces()}
        empty={{ icon: FACE_ICON, title: "No photos of this person", body: "Their photos were moved or deleted." }}
        trailing={<UKIconButton color="standard" icon={EDIT_ICON} alt="Name this person" onClick={rename} />}
      />
    </>
  );
};

export default PersonPage;
