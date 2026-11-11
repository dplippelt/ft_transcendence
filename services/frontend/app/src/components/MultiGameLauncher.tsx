import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLobbies } from "../contexts/LobbiesContext";
import { DEFAULT_OPS_MASK, GameType, getPathToGame } from "../utils/utils";


export default function MultiGameLauncher() {
    const { startedMultiGame, clearStartedMultiGame } = useLobbies();
    const navigate = useNavigate();

    useEffect(() => {
        if (!startedMultiGame)
            return;

        navigate(getPathToGame(
            parseInt(DEFAULT_OPS_MASK, 2), 
            GameType.OnlineCoop, 
            startedMultiGame.gameSessionId
        ));

        clearStartedMultiGame();

    }, [startedMultiGame, navigate, clearStartedMultiGame]);

    return null;
}