/* @refresh reload */
import { render } from "solid-js/web";
import "./index.scss";
// import "solid-devtools";
import App from "./App.tsx";

const root = document.getElementById("root");

render(() => <App />, root!);
