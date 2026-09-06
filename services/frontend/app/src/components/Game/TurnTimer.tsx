import { useEffect, useState } from "react";
import { EventBus } from "../../game/EventBus";
import { CombatEvent, GameEvent } from "../../utils/utils";
import styles from "./TurnTimer.module.scss";
import React from "react";

export default function TurnTimer()
{
	const [turnTime, setTurnTime] = useState<number>(0);
	const [turn, setTurn] = useState<number>(0);
	const [isPaused, setIsPaused] = useState<boolean>(false);
	const [elapsedTime, setElapsedTime] = useState<number>(0);

	useEffect(() =>
	{
		function initTurnTime( playerTurnTime: number, elapsedTime: number = 0 ) {
			setTurnTime(playerTurnTime);
			setElapsedTime(elapsedTime);
			setTurn(prev => prev + 1)
		}
		EventBus.addListener(CombatEvent.initTurn, initTurnTime);

		function endTurn() { setTurnTime(0); }
		EventBus.addListener(CombatEvent.turnEnded, endTurn);

		function pauseTimer( isPaused: boolean ) { setIsPaused(isPaused); }
		EventBus.addListener(CombatEvent.pauseTimer, pauseTimer);

		function onGameVisible( visible: boolean ) { if ( visible ) EventBus.emit(CombatEvent.getTurnTimerState); }
		EventBus.addListener(GameEvent.gameVis, onGameVisible);

		EventBus.emit(CombatEvent.getTurnTimerState);

		function cleanup()
		{
			EventBus.removeListener(CombatEvent.initTurn, initTurnTime);
			EventBus.removeListener(CombatEvent.turnEnded, endTurn);
			EventBus.removeListener(CombatEvent.pauseTimer, pauseTimer);
			EventBus.removeListener(GameEvent.gameVis, onGameVisible);
		}

		return () => cleanup();
	}, []);

	return (
		<div
			key={turn}
			className={styles.turnTimer}
			style={ {
				'--turn-duration': `${turnTime}ms`,
				'--start-delay': `-${elapsedTime}ms`,
				'--timer-play-state': isPaused  ? 'paused' : 'running',
			} as React.CSSProperties }
		/>
	);
}
