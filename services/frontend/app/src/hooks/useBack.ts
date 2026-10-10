import { useNavigate } from "react-router-dom";

export default function useBack()
{
  const navigate = useNavigate();

  function goBack( fallback: string ) {
    // React Router's BrowserHistory stores the entry's index in history.state.idx
    // Whenever an entry is pushed to React Router history it is incremented by 1.
    // For replace navigations it stays what it was.
    // NB: It is a React Router internal, not part of the public API, so it may change between versions.
    const hasHistory = (window.history.state?.idx ?? 0) > 0;

    if ( hasHistory )
      navigate(-1);
    else
      navigate(fallback, { replace: true });
  }

  return goBack;
}
