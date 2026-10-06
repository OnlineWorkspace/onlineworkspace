import STAR_ICON from "@material-symbols/svg-700/outlined/star.svg";
import type { Component } from "solid-js";
import CollectionPage from "../../components/CollectionPage";
import { routes } from "../../lib/routes";

const FavoritesPage: Component = () => (
  <CollectionPage
    title="Favorites"
    query={{ scope: "favorites" }}
    kind="library"
    backTo={routes.albums()}
    empty={{ icon: STAR_ICON, title: "No favorites yet", body: "Tap the star on a photo to find it here." }}
  />
);

export default FavoritesPage;
