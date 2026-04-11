import { onMount, useContext, type Component } from "solid-js";
import { ViewContext } from "../ViewContext";
import trpc from "../../../lib/trpc";
import path from "path-browserify";

const GridItemRename: Component<{ name: string; path: string; refetchGrid: () => void }> = (props) => {
    const viewCtx = useContext(ViewContext);
    let ref!: HTMLInputElement;

    onMount(() => {
        ref.focus();
    });

    return (
        <input
            onBlur={async (e) => {
                viewCtx?.setRenameEntry(undefined);

                const oldPath = props.path;
                const newPath = path.join(props.path, "..", e.currentTarget.value);

                if (oldPath !== newPath) {
                    await trpc.batchMove.mutate([
                        {
                            path: oldPath,
                            newPath: newPath,
                        },
                    ]);

                    props.refetchGrid();
                }
            }}
            onSubmit={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.currentTarget.blur();
                }
            }}
            value={props.name}
            placeholder={"Rename Text Input Here"}
            ref={ref}
            type="text"
        ></input>
    );
};

export default GridItemRename;
