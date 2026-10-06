import { Route } from "@solidjs/router";
import { type Component, lazy } from "solid-js";

const PhotosLayout = lazy(() => import("./Layout"));
const PhotosPage = lazy(() => import("./pages/photos/Index"));
const SearchPage = lazy(() => import("./pages/search/Index"));
const AlbumsPage = lazy(() => import("./pages/albums/Index"));
const AlbumPage = lazy(() => import("./pages/album/Index"));
const FavoritesPage = lazy(() => import("./pages/favorites/Index"));
const ArchivePage = lazy(() => import("./pages/archive/Index"));
const MemoriesPage = lazy(() => import("./pages/memories/Index"));
const MemoryPage = lazy(() => import("./pages/memory/Index"));
const FacesPage = lazy(() => import("./pages/faces/Index"));
const PersonPage = lazy(() => import("./pages/person/Index"));
const SharingPage = lazy(() => import("./pages/sharing/Index"));
const TrashPage = lazy(() => import("./pages/trash/Index"));

const App: Component = () => {
  return (
    <Route component={PhotosLayout}>
      <Route path="/" component={PhotosPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/albums" component={AlbumsPage} />
      <Route path="/albums/:id" component={AlbumPage} />
      <Route path="/favorites" component={FavoritesPage} />
      <Route path="/archive" component={ArchivePage} />
      <Route path="/memories" component={MemoriesPage} />
      <Route path="/memories/:id" component={MemoryPage} />
      <Route path="/faces" component={FacesPage} />
      <Route path="/faces/:id" component={PersonPage} />
      <Route path="/sharing" component={SharingPage} />
      <Route path="/trash" component={TrashPage} />
    </Route>
  );
};

export default App;
