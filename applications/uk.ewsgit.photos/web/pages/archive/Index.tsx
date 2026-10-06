import ARCHIVE_ICON from "@material-symbols/svg-700/outlined/archive.svg";
import type { Component } from "solid-js";
import CollectionPage from "../../components/CollectionPage";
import { routes } from "../../lib/routes";

const ArchivePage: Component = () => (
  <CollectionPage
    title="Archive"
    query={{ scope: "archive" }}
    kind="archive"
    backTo={routes.albums()}
    note="Archived photos stay out of your main view, but remain in albums and in search."
    empty={{ icon: ARCHIVE_ICON, title: "Nothing archived", body: "Archive photos you want to keep but not see every day." }}
  />
);

export default ArchivePage;
