import { createResource } from "solid-js";
import { errorMessage } from "./media";
import { usePhotos } from "./context";

/**
 * Loads data and reloads it whenever the library changes.
 * Errors are returned as data so that a failed reload never throws into Suspense / error boundaries.
 * `source` returning undefined means "nothing to load yet".
 */
export function createQuery<Source, Data>(source: () => Source | undefined, fetcher: (source: Source) => Promise<Data>) {
  const photos = usePhotos();

  const [resource] = createResource(
    () => {
      const current = source();
      return current === undefined ? undefined : { current, version: photos.version() };
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
    // true only until the first result, a reload keeps showing the previous one
    loading: () => resource.latest === undefined,
  };
}
