import { Route } from "@solidjs/router";
import type { Component } from "solid-js";
import RootPage from "./pages/root";

const App: Component = () => {
  return <Route path={"/"} component={RootPage} />;
};

export default App;
