import { useEffect, useRef, useState } from "react"
import styles from "./CardTest.module.css"

const NUMERIC_CARD_POOL = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const OPERATOR_CARD_POOL = ["+", "-", "*", "/", "%", "^"];
const ENEMY_HP = 25;
const ENEMY_RANGE = [1, 8];
const ENEMY_DMG = 1;
const ATTACK_INTERVAL = 10000; //milliseconds
const N_CARDS = 10;
const PLAYER_HP = 10;

type AppStates =
{
	gameState: GameState,
	enemyHP: number,
	enemyRange: number[],
	enemyDMG: number,
	enemyAttackInterval: number,
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
	setEnemyAttackInterval: React.Dispatch<React.SetStateAction<number>>,
	setPlayerHP: React.Dispatch<React.SetStateAction<number>>,
	setPlayerCards: React.Dispatch<React.SetStateAction<string[]>>,
	setSelectedCards: React.Dispatch<React.SetStateAction<string[]>>,
	drawCards: () => void,
}

type EnemyProps =
{
	states: AppStates,
	controls: Controls,
}

type PlayerProps =
{
	states: AppStates,
	controls: Controls,
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

function Enemy( { states, controls } : EnemyProps )
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
			<div>{`Enemy HP: ${states.enemyHP}, DMG: ${states.enemyDMG}, Attack Interval: ${states.enemyAttackInterval / 1000}s, Range: ${states.enemyRange[0]} - ${states.enemyRange[1]}`}</div>
			<button className={styles.generateEnemey} onClick={generateNewEnemy}>Generate new enemy</button>
		</div>

	)
}

function Player( { states, controls } : PlayerProps )
{
	function randomizeHP()
	{
		controls.setPlayerHP(getRandomInt(5, 20));
		controls.setGameState(GameState.Running);
	}

	return (
		<div className={styles.player}>
			<div>{`Player HP: ${states.playerHP}`}</div>
			<button className={styles.randomizeHp} onClick={randomizeHP}>Randomize HP</button>
		</div>
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
		controls.drawCards();
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
	const [enemyHP, setEnemyHP] = useState<number>(ENEMY_HP);
	const [enemyRange, setEnemyRange] = useState<number[]>(ENEMY_RANGE);
	const [enemyDMG, setEnemyDMG] = useState<number>(ENEMY_DMG);
	const [enemyAttackInterval, setEnemyAttackInterval] = useState<number>(ATTACK_INTERVAL);
	const [playerHP, setPlayerHP] = useState<number>(PLAYER_HP);
	const [playerCards, setPlayerCards] = useState<string[]>([]);
	const [selectedCards, setSelectedCards] = useState<string[]>([]);
	const dmgInterval = useRef<number | undefined>(undefined);

	const states: AppStates =
	{
		gameState: gameState,
		enemyHP: enemyHP,
		enemyRange: enemyRange,
		enemyDMG: enemyDMG,
		enemyAttackInterval: enemyAttackInterval,
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
		setEnemyAttackInterval: setEnemyAttackInterval,
		setPlayerHP: setPlayerHP,
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
		setPlayerCards(prev =>
		{
			const newCards: string[] = [];
			const cardsToDraw = prev.length === N_CARDS ? N_CARDS : N_CARDS - prev.length;

			for ( let n = 0; n < cardsToDraw; n++ )
			{
				let newCard = "";
				const cardType: CardType = Math.random() < 0.33 ? CardType.operator : CardType.numeric;

				if ( cardType === CardType.numeric )
					newCard = NUMERIC_CARD_POOL[getRandomInt(0, NUMERIC_CARD_POOL.length - 1)];
				else
					newCard = OPERATOR_CARD_POOL[getRandomInt(0, OPERATOR_CARD_POOL.length - 1)];

				newCards.push(newCard);
			}

			if ( prev.length === N_CARDS )
				return newCards;
			return [...prev, ...newCards];
		});
		setSelectedCards([]);
	}

	useEffect(() =>
	{
		if ( dmgInterval.current )
			clearInterval(dmgInterval.current);

		if ( gameState !== GameState.Running )
			return;

		dmgInterval.current = setInterval(() => enemyAttack(enemyDMG), enemyAttackInterval);

		return () => clearInterval(dmgInterval.current);
	}, [enemyDMG, enemyHP, enemyAttackInterval, gameState]);

	useEffect(() =>
	{
		drawCards();
	}, [])

	return (
		<div className={styles.tester}>
			<Enemy states={states} controls={controls}/>
			<Player states={states} controls={controls}/>
			<Cards states={states} controls={controls}/>
			<SelectedCards states={states} controls={controls}/>
			<Buttons states={states} controls={controls}/>
			<GameResult states={states}/>
		</div>
	);
}
