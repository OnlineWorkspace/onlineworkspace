import { useNavigate } from "@solidjs/router";
import { onMount, type Component } from "solid-js";
import trpc from "../lib/trpc.ts";

const Redirect: Component = () => {
    const navigate = useNavigate();

    onMount(async () => {
        navigate(`/app/uk.tcsw.files/dir${await trpc.getHome.query()}`);
    });

    return <></>;
};

export default Redirect;
