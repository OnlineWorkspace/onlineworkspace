import { createResource } from "solid-js";
import { useFiles } from "./context";

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

/**
 * Loads a listing and reloads it whenever the files change.
 * Errors are returned as data so that a failed reload never throws into Suspense / error boundaries.
 * `source` returning undefined means "nothing to load yet".
 */
export function createListing<Source, Data>(source: () => Source | undefined, fetcher: (source: Source) => Promise<Data>) {
  const files = useFiles();

  const [resource] = createResource(
    () => {
      const current = source();
      return current === undefined ? undefined : { current, version: files.version() };
    },
    async ({ current }): Promise<{ data: Data } | { error: string }> => {
      try {
        return { data: await fetcher(current) };
      } catch (error) {
        return { error: errorMessage(error) };
      }
    },
  );

  return {
    data: () => {
      const result = resource.latest;
      return result && "data" in result ? result.data : undefined;
    },
    error: () => {
      const result = resource.latest;
      return result && "error" in result ? result.error : undefined;
    },
    loading: () => resource.loading,
  };
}
