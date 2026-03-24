import { Route } from "@solidjs/router";
import { type Component, lazy } from "solid-js";

const PhotosLayout = lazy(() => import("./Layout"));
const GalleryPage = lazy(() => import("./pages/gallery/Index"));
const MoreSettingsPage = lazy(() => import("./pages/moreSettings/Index"));
const SearchAlbumsPage = lazy(() => import("./pages/search/albums/Index"));
const SearchPage = lazy(() => import("./pages/search/Index"));
const SearchLayout = lazy(() => import("./pages/search/Layout"));
const SearchPeoplePage = lazy(() => import("./pages/search/people/Index"));
const SearchPlacesPage = lazy(() => import("./pages/search/places/Index"));

const App: Component = () => {
  return (
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
  );
};

export default App;
