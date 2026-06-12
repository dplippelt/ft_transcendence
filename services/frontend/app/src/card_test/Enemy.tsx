import { GameState, PLAYER_HP, type AppStates, type Controls } from "./CardTest"
import { getRandomInt } from "./utils"
import styles from "./Enemy.module.scss"

type EnemyProps =
{
	states: AppStates,
	controls: Controls,
}

export default function Enemy( { states, controls } : EnemyProps )
{
	function generateNewEnemy()
	{
		controls.setEnemyHP(getRandomInt(5, 50));
		controls.setEnemyDMG(getRandomInt(1, 3));
		controls.setEnemyAttackInterval(getRandomInt(3, 10) * 1000);

		const enemyRange: number[] = [];
		enemyRange.push(getRandomInt(0, 10));
		enemyRange.push(enemyRange[0] + getRandomInt(1, 10));

		controls.setEnemyRange(enemyRange);
		controls.setPlayerHP(PLAYER_HP);
		controls.setPlayerCards([]);
		controls.setSelectedCards([]);
		controls.drawCards();
		controls.setGameState(GameState.Running);
	}

	return (
		<div className={styles.enemy}>
			<div className={styles.enemyText}>{`Enemy HP: ${states.enemyHP}, DMG: ${states.enemyDMG}, Attack Interval: ${states.enemyAttackInterval / 1000}s, Range: ${states.enemyRange[0]} - ${states.enemyRange[1]}`}</div>
			<button className={styles.generateEnemey} onClick={generateNewEnemy}>Generate new enemy</button>
		</div>

	)
}
