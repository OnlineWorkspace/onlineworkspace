import type { Component, ParentProps } from "solid-js";
import ActionsMenuBar from "./components/ActionsMenuBar/ActionsMenuBar.tsx";
import PathBar from "./components/PathBar/PathBar.tsx";
import SideBar from "./components/SideBar/SideBar.tsx";
import StatusBar from "./components/StatusBar/StatusBar.tsx";
import styles from "./Layout.module.scss"

const Layout: Component<ParentProps> = (props) => {
    return (
        <div class={styles.root}>
            <ActionsMenuBar />
            <PathBar />
            <SideBar />
            {props.children}
            <StatusBar />
        </div>
    );
}

export default Layout
