import { useNavigate } from "@solidjs/router";
import { type Component, onMount } from "solid-js";
import trpc from "../lib/trpc.ts";

const Redirect: Component = () => {
  const navigate = useNavigate();

  onMount(async () => {
    navigate(`/app/uk.ewsgit.files/dir${await trpc.getHome.query()}`);
  });

  return <></>;
};

export default Redirect;
