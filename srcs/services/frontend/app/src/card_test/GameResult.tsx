import { GameState, type AppStates } from "./CardTest"
import styles from "./GameResult.module.scss"

type GameResultProps =
{
	states: AppStates,
}

export default function GameResult( { states } : GameResultProps )
{
	if ( states.gameState === GameState.GameOver )
		return <div className={styles.gameResult}>You lost!</div>
	else if ( states.gameState === GameState.Won )
		return <div className={styles.gameResult}>You won!</div>
	return null;
}
