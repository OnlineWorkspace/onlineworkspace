import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { type Component, createEffect, createSignal, on, onCleanup } from "solid-js";
import FileBrowser from "../../components/FileBrowser";
import { parentOf, pathFromParam, routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { createListing } from "../../lib/useListing";

const SEARCH_DEBOUNCE_MS = 250;

const BrowsePage: Component = () => {
  const params = useParams<{ path?: string }>();
  const [searchParams, setSearchParams] = useSearchParams<{ q?: string }>();
  const navigate = useNavigate();

  const path = () => pathFromParam(params.path);
  const query = () => (typeof searchParams.q === "string" ? searchParams.q.trim() : "");

  const [text, setText] = createSignal(typeof searchParams.q === "string" ? searchParams.q : "");

  // typing updates the URL after a pause, so that searches can be linked to and survive reloads
  let debounce: ReturnType<typeof setTimeout> | undefined;
  const changeSearch = (value: string) => {
    setText(value);
    clearTimeout(debounce);
    debounce = setTimeout(() => setSearchParams({ q: value.trim() || undefined }, { replace: true }), SEARCH_DEBOUNCE_MS);
  };
  onCleanup(() => clearTimeout(debounce));

  // navigating to another folder ends the search
  createEffect(
    on(path, () => {
      clearTimeout(debounce);
      setText("");
    }, { defer: true }),
  );

  const listing = createListing(path, (current) => trpc.list.query({ path: current }));
  const results = createListing(
    () => (query() ? { query: query(), path: path() } : undefined),
    (input) => trpc.search.query(input),
  );

  const searching = () => query() !== "";
  const folderName = () => (path() === "/" ? "Home" : path().split("/").filter(Boolean).at(-1)!);

  return (
    <FileBrowser
      title={searching() ? "Search results" : folderName()}
      entries={searching() ? results.data() : listing.data()?.entries}
      loading={searching() ? results.loading() : listing.loading()}
      error={searching() ? results.error() : listing.error()}
      emptyMessage={searching() ? `Nothing found for “${query()}”` : "This folder is empty. Drop files here or use New to add some."}
      breadcrumbs={searching() ? undefined : listing.data()?.breadcrumbs ?? [{ name: "Home", path: "/" }]}
      directory={path()}
      search={{ value: text, onChange: changeSearch, placeholder: `Search in ${folderName()}` }}
      showFilters
      showLocation={searching()}
      onBack={() => {
        if (searching()) changeSearch("");
        else navigate(path() === "/" ? routes.home() : routes.browse(parentOf(path())));
      }}
    />
  );
};

export default BrowsePage;
