import { type Component, createResource, lazy, Show } from "solid-js";
import Redirect from "../components/Redirect";
import trpc from "../lib/trpc";

const Setup = lazy(() => import("./setup/Setup"));

/** the instance setup wizard until the instance has been set up, then the usual page */
const Home: Component = () => {
  const [status] = createResource(() => trpc.setup.status.query());

  return (
    <Show when={status()}>
      <Show when={status()?.complete} fallback={<Setup />}>
        <Redirect to={"/auth/login"} />
      </Show>
    </Show>
  );
};

export default Home;
