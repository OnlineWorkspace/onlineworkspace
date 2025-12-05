import type { Component } from "solid-js";
import styles from "./Index.module.scss"
import Users from "./components/Users/Users";
import InstalledApplications from "./components/InstalledApplications/InstalledApplications";

const InstancePage: Component = () => {
    return (
        <div class={styles.root}>
            <Users />
            <InstalledApplications />
        </div>
    );
};

export default InstancePage;
