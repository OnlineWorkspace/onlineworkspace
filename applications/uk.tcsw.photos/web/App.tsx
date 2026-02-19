import { type Component } from "solid-js";
import { Route } from "@solidjs/router";
import PhotosLayout from "./Layout";
import GalleryPage from "./pages/gallery/Index";
import SearchPage from "./pages/search/Index";
import MoreSettingsPage from "./pages/moreSettings/Index";

const App: Component = () => {
    return (
        <>
            <Route component={PhotosLayout}>
                <Route path="/" component={GalleryPage} />
                <Route path="/search" component={SearchPage} />
                <Route path="/more" component={MoreSettingsPage} />
            </Route>
        </>
    );
};

export default App;
