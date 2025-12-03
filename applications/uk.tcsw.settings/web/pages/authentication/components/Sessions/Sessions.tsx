import {createResource, For, type Component} from "solid-js";
import trpc from "../../../../lib/trpc";
import Session from "./components/Session/Session";

const Sessions: Component = () => {
    const [ sessions ] = createResource(() => trpc.authentication.getSessions.query())

    return <For each={sessions()}>
        {s => {
            return <Session {...s} />
        }}
    </For>
}

export default Sessions