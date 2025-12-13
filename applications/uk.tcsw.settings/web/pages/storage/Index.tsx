import type { Component } from "solid-js";
import UsageGraph from "./components/UsageGraph/UsageGraph";
import styles from "./Index.module.scss";

const StoragePage: Component = () => {
    return (
        <div class={styles.page}>
            <UsageGraph />
        </div>
    );
};

export default StoragePage;
