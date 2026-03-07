import { type Component } from "solid-js";
import { Route } from "@solidjs/router";
import PhotosLayout from "./Layout";
import GalleryPage from "./pages/gallery/Index";
import SearchPage from "./pages/search/Index";
import MoreSettingsPage from "./pages/moreSettings/Index";
import SearchLayout from "./pages/search/Layout";
import SearchPeoplePage from "./pages/search/people/Index";
import SearchAlbumsPage from "./pages/search/albums/Index";
import SearchPlacesPage from "./pages/search/places/Index";

const App: Component = () => {
  return (
    <>
      <Route component={PhotosLayout}>
        <Route path="/" component={GalleryPage} />
        <Route path="/search" component={SearchLayout}>
          <Route path="/" component={SearchPage} />
          <Route path="/people">
            <Route path="/" component={() => <>No Query!</>} />
            <Route path="/:query" component={SearchPeoplePage} />
          </Route>
          <Route path="/albums">
            <Route path="/" component={() => <>No Query!</>} />
            <Route path="/:query" component={SearchAlbumsPage} />
          </Route>
          <Route path="/places">
            <Route path="/" component={() => <>No Query!</>} />
            <Route path="/:query" component={SearchPlacesPage} />
          </Route>
        </Route>
        <Route path="/more" component={MoreSettingsPage} />
      </Route>
    </>
  );
};

export default App;
