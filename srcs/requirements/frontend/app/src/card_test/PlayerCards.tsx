import type { AppStates, Controls } from "./CardTest"
import styles from "./PlayerCards.module.css"

type CardsProps =
{
	states: AppStates,
	controls: Controls,
}

export default function PlayerCards( { states, controls } : CardsProps )
{
	function clickHandler( idx: number )
	{
		controls.setSelectedCards(prev => [...prev, states.playerCards[idx]]);
		controls.setPlayerCards(prev => prev.filter((_, i) => i !== idx));
	}

	return (
		<div className={styles.cards}>
			<div className={styles.cardsText}>Player Cards:</div>
			{ states.playerCards.map((card, idx) => (
				<button className={styles.card} key={idx} onClick={() => clickHandler(idx)}>{card}</button>
			))}
		</div>
	)
}
