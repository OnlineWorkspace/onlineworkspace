import { createResource, For, type Component } from "solid-js";
import trpc from "../../../lib/trpc";
import { useNavigate, useParams } from "@solidjs/router";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";

const SearchPeoplePage: Component = () => {
    const navigate = useNavigate();
    const params = useParams();
    const [people] = createResource(() => trpc.search.people.query(""));

    return (
        <div>
            <div>
                <UKIconButton
                    icon="chevron_left"
                    alt="Go Back"
                    onClick={() => {
                        navigate("/app/uk.tcsw.photos/search");
                    }}
                />
                <UKText role="title" size="l">
                    {params.query}
                </UKText>
                <For each={people()}>
                    {(person) => {
                        return <>{person()}</>;
                    }}
                </For>
            </div>
        </div>
    );
};

export default SearchPeoplePage;
