import { useEffect, useRef, useState } from "react"
import styles from "./CardTest.module.css"

const NUMERIC_CARD_POOL = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const OPERATOR_CARD_POOL = ["+", "-", "*", "/", "%", "^"];
const ATTACK_INTERVAL = 10000; //milliseconds
const N_CARDS = 10;

type AppStates =
{
	gameState: GameState,
	enemyHP: number,
	enemyRange: number[],
	enemyDMG: number,
	playerHP: number,
	playerCards: string[],
	selectedCards: string[],
}

type Controls =
{
	setGameState: React.Dispatch<React.SetStateAction<GameState>>,
	setEnemyHP: React.Dispatch<React.SetStateAction<number>>,
	setEnemyRange: React.Dispatch<React.SetStateAction<number[]>>,
	setEnemyDMG: React.Dispatch<React.SetStateAction<number>>,
	setPlayerHP: React.Dispatch<React.SetStateAction<number>>,
	setPlayerCards: React.Dispatch<React.SetStateAction<string[]>>,
	setSelectedCards: React.Dispatch<React.SetStateAction<string[]>>,
	drawCards: () => void,
}

type EnemyProps =
{
	states: AppStates,
}

type PlayerProps =
{
	states: AppStates,
}

type CardsProps =
{
	states: AppStates,
	controls: Controls,
}

type DrawCardsProps =
{
	controls: Controls,
}

type PlaySelectedCards =
{
	states: AppStates,
	controls: Controls,
}

type ButtonsProps =
{
	states: AppStates,
	controls: Controls,
}

type GameResultProps =
{
	states: AppStates,
}

enum GameState
{
	Running,
	Won,
	GameOver
}

function getRandomInt( min: number, max: number )
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Enemy( { states } : EnemyProps )
{
	return (
		<div>{`Enemy HP: ${states.enemyHP}, DMG: ${states.enemyDMG}, Range: ${states.enemyRange[0]} - ${states.enemyRange[1]}`}</div>
	)
}

function Player( { states } : PlayerProps )
{
	return (
		<div>{`Player HP: ${states.playerHP}`}</div>
	)
}

function Cards( { states, controls } : CardsProps )
{
	function clickHandler( idx: number )
	{
		controls.setSelectedCards(prev => [...prev, states.playerCards[idx]]);
		controls.setPlayerCards(prev => prev.filter((_, i) => i !== idx));
	}

	return (
		<div className={styles.cards}>
			<div>Player Cards:</div>
			{ states.playerCards.map((card, idx) => (
				<button className={styles.card} key={idx} onClick={() => clickHandler(idx)}>{card}</button>
			))}
		</div>
	)
}

function SelectedCards( { states, controls } : CardsProps )
{
	function clickHandler( idx: number )
	{
		controls.setPlayerCards(prev => [...prev, states.selectedCards[idx]]);
		controls.setSelectedCards(prev => prev.filter((_, i) => i !== idx));
	}

	return (
		<div className={styles.cards}>
			<div>Selected Cards:</div>
			{ states.selectedCards.map((card, idx) => (
				<button className={styles.card} key={idx} onClick={() => clickHandler(idx)}>{card}</button>
			))}
		</div>
	);
}

enum CardType
{
	numeric,
	operator,
}

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

function PlaySelectedCards( { states, controls } : PlaySelectedCards )
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
	}

	return (
		<button className={styles.buttons} onClick={playCards}>PLAY CARDS</button>
	)
}

function Buttons( { states, controls } : ButtonsProps )
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

function GameResult( { states } : GameResultProps )
{
	if ( states.gameState === GameState.GameOver )
		return <div className={styles.gameResult}>You lost!</div>
	else if ( states.gameState === GameState.Won )
		return <div className={styles.gameResult}>You won!</div>
	return null;
}

export default function CardTest()
{
	const [gameState, setGameState] = useState<GameState>(GameState.Running);
	const [enemyHP, setEnemyHP] = useState<number>(25);
	const [enemyRange, setEnemyRange] = useState<number[]>([1, 8]);
	const [enemyDMG, setEnemyDMG] = useState<number>(1);
	const [playerHP, setPlayerHP] = useState<number>(10);
	const [playerCards, setPlayerCards] = useState<string[]>([]);
	const [selectedCards, setSelectedCards] = useState<string[]>([]);
	const dmgInterval = useRef<number | undefined>(undefined);

	const states: AppStates =
	{
		gameState: gameState,
		enemyHP: enemyHP,
		enemyRange: enemyRange,
		enemyDMG: enemyDMG,
		playerHP: playerHP,
		playerCards: playerCards,
		selectedCards: selectedCards,
	}

	const controls: Controls =
	{
		setGameState: setGameState,
		setEnemyHP: setEnemyHP,
		setEnemyRange: setEnemyRange,
		setEnemyDMG: setEnemyDMG,
		setPlayerHP: setEnemyHP,
		setPlayerCards: setPlayerCards,
		setSelectedCards: setSelectedCards,
		drawCards: drawCards,
	}

	function enemyAttack( enemyDMG: number )
	{
		setPlayerHP(prev =>
		{
			const newPlayerHP = prev - enemyDMG < 0 ? 0 : prev - enemyDMG;
			if ( newPlayerHP === 0 )
				setGameState(GameState.GameOver);
			return newPlayerHP;
		});
	}

	function drawCards()
	{
		const newCards = [];

		for ( let n = 0; n < N_CARDS; n++ )
		{
			let newCard = "";
			const cardType: CardType = Math.random() < 0.33 ? CardType.operator : CardType.numeric;

			if ( cardType === CardType.numeric )
				newCard = NUMERIC_CARD_POOL[getRandomInt(0, NUMERIC_CARD_POOL.length - 1)];
			else
				newCard = OPERATOR_CARD_POOL[getRandomInt(0, OPERATOR_CARD_POOL.length - 1)];

			newCards.push(newCard);
		}

		setPlayerCards(newCards);
		setSelectedCards([]);
	}

	useEffect(() =>
	{
		dmgInterval.current = setInterval(() => enemyAttack(enemyDMG), ATTACK_INTERVAL);

		return () => clearInterval(dmgInterval.current);
	}, [enemyDMG]);

	useEffect(() =>
	{
		if ( gameState !== GameState.Running )
			clearInterval(dmgInterval.current);

	}, [gameState]);

	useEffect(() =>
	{
		drawCards();
	}, [])

	return (
		<>
			<Enemy states={states}/>
			<Player states={states}/>
			<Cards states={states} controls={controls}/>
			<SelectedCards states={states} controls={controls}/>
			<Buttons states={states} controls={controls}/>
			<GameResult states={states}/>
		</>
	);
}
