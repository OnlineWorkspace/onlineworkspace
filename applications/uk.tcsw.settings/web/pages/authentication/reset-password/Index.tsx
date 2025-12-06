import { useDialogue } from "@tcsw/uikit-solid/src/components/dialogue/useDialogue.js";
import { createEffect, type Component } from "solid-js";
import ResetPasswordDialogue from "../components/MethodPassword/components/ResetPasswordDialogue/ResetPasswordDialogue";
import { useNavigate } from "@solidjs/router";

const ResetPasswordPage: Component = () => {
    const dialogue = useDialogue();
    const navigate = useNavigate();

    createEffect(() => {
        navigate("/app/uk.tcsw.settings/");
        dialogue.show(<ResetPasswordDialogue dialogueController={dialogue} />);
    });

    return <></>;
};

export default ResetPasswordPage;
