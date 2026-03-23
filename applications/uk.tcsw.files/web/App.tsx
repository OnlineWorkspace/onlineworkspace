import { Route } from "@solidjs/router";
import type { Component } from "solid-js";
import Redirect from "./components/Redirect.tsx";
import ViewContainer from "./components/ViewContainer/ViewContainer.tsx";
import Layout from "./Layout.tsx";

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
