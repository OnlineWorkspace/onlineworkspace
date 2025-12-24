import { createEffect, type Component } from "solid-js";
import { useNavigate } from "@solidjs/router";

const ResetPasswordPage: Component = () => {
    const navigate = useNavigate();

    createEffect(() => {
        navigate("/app/uk.tcsw.settings/");
        alert("Implement new UIKit dialogue");
        // dialogue.show(<ResetPasswordDialogue dialogueController={dialogue} />);
    });

    return <></>;
};

export default ResetPasswordPage;
