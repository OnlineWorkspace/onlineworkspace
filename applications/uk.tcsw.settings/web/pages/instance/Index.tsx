import type { Component } from "solid-js";
import styles from "./Index.module.scss"
import Users from "./components/Users/Users";

const InstancePage: Component = () => {
    return <div class={styles.root}>
        <Users />
    </div>;
};

export default InstancePage;
