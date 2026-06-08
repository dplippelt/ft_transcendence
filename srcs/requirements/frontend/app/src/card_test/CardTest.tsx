import { useEffect, useRef, useState } from "react"
import styles from "./CardTest.module.scss"
import { getRandomInt } from "./utils"
import Enemy from "./Enemy"
import Player from "./Player"
import PlayerCards from "./PlayerCards"
import SelectedCards from "./SelectedCards"
import Buttons from "./Buttons"
import GameResult from "./GameResult"

export const NUMERIC_CARD_POOL = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
export const OPERATOR_CARD_POOL = ["+", "-", "*", "/", "%", "^"];
export const ENEMY_HP = 25;
export const ENEMY_RANGE = [1, 8];
export const ENEMY_DMG = 1;
export const ATTACK_INTERVAL = 10000; //milliseconds
export const N_CARDS = 10;
export const PLAYER_HP = 10;

export enum GameState
{
	Running,
	Won,
	GameOver
}

export enum CardType
{
	numeric,
	operator,
}

export type AppStates =
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

export type Controls =
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
			<PlayerCards states={states} controls={controls}/>
			<SelectedCards states={states} controls={controls}/>
			<Buttons states={states} controls={controls}/>
			<GameResult states={states}/>
		</div>
	);
}
