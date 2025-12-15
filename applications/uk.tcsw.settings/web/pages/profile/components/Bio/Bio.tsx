import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { createResource, type Component } from "solid-js";
import trpc from "../../../../lib/trpc";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import styles from "./Bio.module.scss";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";

const Bio: Component = () => {
    const [bio, { mutate: setBio, refetch: refetchBio }] = createResource(() => trpc.profile.getBio.query());

    return (
        <UKStackItem
            leading={{
                type: "icon",
                value: "description",
            }}
            labelText="Bio"
            supportingText={"Tell people a bit about yourself"}
            onCollapse={() => {
                refetchBio();
            }}
            expandedComponent={
                <div class={styles.expanded}>
                    <UKTextField as={"textarea"} color="outlined" getValue={setBio} defaultValue={bio()} label="Bio" />
                    <UKButton
                        class={styles.button}
                        onClick={async () => {
                            await trpc.profile.setName.mutate(bio() || "");

                            refetchBio();
                        }}
                    >
                        Save
                    </UKButton>
                </div>
            }
        />
    );
};

export default Bio;
