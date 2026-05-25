import { GameState, type AppStates, type Controls } from "./CardTest"
import styles from "./Buttons.module.css"

type ButtonsProps =
{
	states: AppStates,
	controls: Controls,
}

type DrawCardsProps =
{
	controls: Controls,
}

type PlaySelectedCardsProps =
{
	states: AppStates,
	controls: Controls,
}

// /* Previous draw card button that draws one card at a time */
// function DrawCard( { controls } : DrawCardsProps )
// {
// 	function drawCard()
// 	{
// 		let newCard = "";
// 		const cardType: CardType = Math.random() < 0.33 ? CardType.operator : CardType.numeric;

// 		if ( cardType === CardType.numeric )
// 			newCard = NUMERIC_CARD_POOL[getRandomInt(0, NUMERIC_CARD_POOL.length - 1)];
// 		else
// 			newCard = OPERATOR_CARD_POOL[getRandomInt(0, OPERATOR_CARD_POOL.length - 1)]

// 		controls.setPlayerCards(prev => [...prev, newCard]);
// 	}

// 	return (
// 		<button className={styles.buttons} onClick={drawCard}>DRAW CARD</button>
// 	)
// }

function DrawCards( { controls } : DrawCardsProps )
{
	return (
		<button className={styles.buttons} onClick={controls.drawCards}>DRAW CARDS</button>
	)
}

function PlaySelectedCards( { states, controls } : PlaySelectedCardsProps )
{
	function processOperator( result: number, i: number ) : number | null
	{
		if ( i + 1 >= states.selectedCards.length )
			return null;

		switch ( states.selectedCards[i] )
		{
			case "+":
				return result + Number(states.selectedCards[i + 1]);
			case "-":
				return result - Number(states.selectedCards[i + 1]);
			case "*":
				return result * Number(states.selectedCards[i + 1]);
			case "/":
				return result / Number(states.selectedCards[i + 1]);
			case "%":
				return result % Number(states.selectedCards[i + 1]);
			case "^":
				return Math.pow(result, Number(states.selectedCards[i + 1]));
			default:
				return 0;
		}
	}

	function playCards()
	{
		let result: number | null = null;

		for ( let i = 0; i < states.selectedCards.length; )
		{
			if ( i === 0 && !isNaN(Number(states.selectedCards[i])) )
			{
				result = Number(states.selectedCards[i]);
				i++;
			}
			else if ( result !== null && isNaN(Number(states.selectedCards[i])) )
			{

				result = processOperator(result, i);
				i += 2;
			}
			else
				i++;
		}

		console.log(result);

		if ( result === null || result < states.enemyRange[0] || result > states.enemyRange[1] )
			return;

		function getPlayerDamage( nCards: number )
		{
			return Math.pow(nCards, 2) - ( Math.floor(nCards / 2) * (nCards + 2) );
		}

		controls.setEnemyHP(prev =>
		{
			const playerDMG = getPlayerDamage(states.selectedCards.length);
			const newEnemyHP = prev - playerDMG < 0 ? 0 : prev - playerDMG;
			if ( newEnemyHP === 0 )
				controls.setGameState(GameState.Won);
			return newEnemyHP;
		})

		controls.setSelectedCards([]);
		controls.drawCards();
	}

	return (
		<button className={styles.buttons} onClick={playCards}>PLAY CARDS</button>
	)
}

export default function Buttons( { states, controls } : ButtonsProps )
{
	if ( states.gameState === GameState.Running )
	{
		return (
			<>
				<DrawCards controls={controls}/>
				<PlaySelectedCards states={states} controls={controls}/>
			</>
		)
	}
	return null;
}
