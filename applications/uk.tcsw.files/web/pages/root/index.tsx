import { type Component } from "solid-js";
import styles from "./index.module.scss";
import ViewContainer from "../../components/ViewContainer/ViewContainer";

const RootPage: Component = () => {
    return (
        <div class={styles.root}>
            <ViewContainer />
        </div>
    );
};

export default RootPage;
