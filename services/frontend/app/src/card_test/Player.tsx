import { GameState, type AppStates, type Controls } from "./CardTest"
import { getRandomInt } from "./utils"
import styles from "./Player.module.css"

type PlayerProps =
{
	states: AppStates,
	controls: Controls,
}

export default function Player( { states, controls } : PlayerProps )
{
	function randomizeHP()
	{
		controls.setPlayerHP(getRandomInt(5, 20));
		controls.setGameState(GameState.Running);
	}

	return (
		<div className={styles.player}>
			<div className={styles.playerText}>{`Player HP: ${states.playerHP}`}</div>
			<button className={styles.randomizeHp} onClick={randomizeHP}>Randomize HP</button>
		</div>
	)
}
