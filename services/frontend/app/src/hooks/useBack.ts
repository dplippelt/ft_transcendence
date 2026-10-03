import { useLocation, useNavigate } from "react-router-dom";

export default function useBack()
{
  const navigate = useNavigate();
  const location = useLocation();

  function goBack( fallback: string ) {
    if ( location.key !== "default" )
      navigate(-1);
    else
      navigate(fallback);
  }

  return goBack;
}
