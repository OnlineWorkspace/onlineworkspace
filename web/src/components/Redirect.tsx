import { useNavigate } from "@solidjs/router";
import { type Component, onMount } from "solid-js";

const Redirect: Component<{ to: string }> = (props) => {
  const navigate = useNavigate();

  onMount(() => {
    navigate(props.to);
  });

  return null;
};

export default Redirect;
