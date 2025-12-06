import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import type { DialogueController } from "@tcsw/uikit-solid/src/components/dialogue/context.js";
import UKDialogue from "@tcsw/uikit-solid/src/components/dialogue/UKDialogue.jsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import { createSignal, type Component } from "solid-js";
import styles from "./ResetPasswordDialogue.module.scss";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";

const ResetPasswordDialogue: Component<{ dialogueController: DialogueController }> = (props) => {
    const [passwordOne, setPasswordOne] = createSignal<string>("");
    const [passwordTwo, setPasswordTwo] = createSignal<string>("");

    return (
        <UKDialogue dialogueController={props.dialogueController}>
            <UKCard class={styles.root} color={"outlined"}>
                <UKText role="title" size="l">
                    Change password
                </UKText>
                <UKDivider direction={DividerDirection.horizontal} />
                <UKTextField label="New Password" color="outlined" getValue={setPasswordOne} defaultValue={passwordOne()} />
                <UKTextField label="Re-Enter New Password" color="outlined" getValue={setPasswordTwo} defaultValue={passwordTwo()} />
                <UKButton
                    leadingIcon="check"
                    color="filled"
                    class={styles.confirmButton}
                    onClick={() => 0}
                    disabled={!(passwordOne() === passwordTwo())}
                >
                    Confirm
                </UKButton>
            </UKCard>
        </UKDialogue>
    );
};

export default ResetPasswordDialogue;
