import { Route } from "@solidjs/router";
import { type Component, lazy } from "solid-js";

const DashboardLayout = lazy(() => import("./Layout"));
const RootPage = lazy(() => import("./pages/root"));
const EditPage = lazy(() => import("./pages/edit"));

const App: Component = () => {
  return (
    <Route component={DashboardLayout}>
      <Route path={"/"} component={RootPage} />
      <Route path={"/edit"} component={EditPage} />
    </Route>
  );
};

export default App;
