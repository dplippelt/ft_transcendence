import type { AppStates, Controls } from "./CardTest"
import styles from "./SelectedCards.module.scss"

type CardsProps =
{
	states: AppStates,
	controls: Controls,
}

export default function SelectedCards( { states, controls } : CardsProps )
{
	function clickHandler( idx: number )
	{
		controls.setPlayerCards(prev => [...prev, states.selectedCards[idx]]);
		controls.setSelectedCards(prev => prev.filter((_, i) => i !== idx));
	}

	return (
		<div className={styles.cards}>
			<div className={styles.cardsText}>Selected Cards:</div>
			{ states.selectedCards.map((card, idx) => (
				<button className={styles.card} key={idx} onClick={() => clickHandler(idx)}>{card}</button>
			))}
		</div>
	);
}
