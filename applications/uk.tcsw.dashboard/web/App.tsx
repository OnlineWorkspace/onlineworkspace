import { Route } from "@solidjs/router";
import { type Component, lazy } from "solid-js";

const RootPage = lazy(() => import("./pages/root"));

const App: Component = () => {
  return <Route path={"/"} component={RootPage} />;
};

export default App;
