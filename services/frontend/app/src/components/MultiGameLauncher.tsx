import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLobbies } from "../contexts/LobbiesContext";
import { buildRoute, DEFAULT_OPS_MASK, RouteParamKey, RoutePath } from "../utils/utils";


export default function MultiGameLauncher() {
    const { startedMultiGame, clearStartedMultiGame } = useLobbies();
    const navigate = useNavigate();

    useEffect(() => {
        if (!startedMultiGame)
            return;

        navigate(buildRoute(RoutePath.game, {
            [RouteParamKey.ops]: DEFAULT_OPS_MASK,
            [RouteParamKey.session]: startedMultiGame.gameSessionId,
        }));

        clearStartedMultiGame();

    }, [startedMultiGame, navigate, clearStartedMultiGame]);

    return null;
}