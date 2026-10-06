import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";

interface ViewerState {
  // set when the viewer was opened from a page, so closing it can simply go back
  viewer?: boolean;
}

/** The viewer is a layer on top of whatever page is showing, addressed with `?photo=<id>`, so the page underneath keeps its scroll position. */
export function useViewer() {
  const navigate = useNavigate();
  const location = useLocation<ViewerState>();
  const [params] = useSearchParams();

  const id = () => {
    const value = Array.isArray(params.photo) ? params.photo[0] : params.photo;
    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  };

  return {
    id,
    open(photoId: number) {
      navigate(`${location.pathname}?photo=${photoId}`, { state: { viewer: true } satisfies ViewerState });
    },
    // moving between photos replaces the entry, so one press of back still closes the viewer
    show(photoId: number) {
      navigate(`${location.pathname}?photo=${photoId}`, { replace: true, state: { viewer: location.state?.viewer } satisfies ViewerState });
    },
    close() {
      if (location.state?.viewer) navigate(-1);
      else navigate(location.pathname, { replace: true });
    },
  };
}
