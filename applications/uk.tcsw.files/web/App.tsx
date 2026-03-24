import { Route } from "@solidjs/router";
import { type Component, lazy } from "solid-js";

const Redirect = lazy(() => import("./components/Redirect.tsx"));
const ViewContainer = lazy(() => import("./components/ViewContainer/ViewContainer.tsx"));
const Layout = lazy(() => import("./Layout.tsx"));

const App: Component = () => {
  return (
    <>
      <Route path={"/"} component={Redirect} />
      <Route component={Layout}>
        <Route path={"/dir"} component={ViewContainer} />
        <Route path={"/dir/*currentPath"} component={ViewContainer} />
      </Route>
    </>
  );
};

export default App;
