import type {Component} from "solid-js";
import styles from "./GalleryView.module.scss"

const GalleryView: Component = () => {
  return <>
    <div>
      <div class={styles.galleryItems}>Gallery Items</div>
      Gallery View Header
    </div>
    <div>
      Gallery View Grid List
    </div>
  </>
}

export default GalleryView
