import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import type { Component } from "solid-js";
import styles from "./Index.module.scss";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";

const SearchPage: Component = () => {
    return (
        <>
            <UKTopAppBar type="search" getValue={() => {}} value={() => ""} placeholder="Begin typing to search" />
            <div class={styles.page}>
                <UKStack class={styles.searchResults}>
                    <UKStackItem labelText="Search Result 1" />
                    <UKStackItem labelText="Search Result 2" />
                    <UKStackItem labelText="Search Result 3" />
                </UKStack>
                <UKDivider
                    class={styles.searchResultsDivider}
                    width="middle-inset"
                    direction={DividerDirection.horizontal}
                />
                <section class={styles.content}>
                    <div class={styles.category}>
                        <UKCard class={styles.previewCollage}>
                            <img
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop"
                                alt="Person 1"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
                                alt="Person 2"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop"
                                alt="Person 3"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop"
                                alt="Person 4"
                            />
                        </UKCard>
                        <UKText role="label" size="m">
                            People
                        </UKText>
                    </div>
                    <div class={styles.category}>
                        <UKCard class={styles.previewCollage}>
                            <img
                                src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150&h=150&fit=crop"
                                alt="Album 1"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&h=150&fit=crop"
                                alt="Album 2"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&h=150&fit=crop"
                                alt="Album 3"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&h=150&fit=crop"
                                alt="Album 4"
                            />
                        </UKCard>
                        <UKText role="label" size="m">
                            Albums
                        </UKText>
                    </div>
                </section>
            </div>
        </>
    );
};

export default SearchPage;
