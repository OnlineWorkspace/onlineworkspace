import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";

const Redirect: Component = () => {
    const navigate = useNavigate();

    navigate("/app/uk.tcsw.files/dir/users/");

    return <></>;
};

export default Redirect;
