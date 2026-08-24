import { useEffect, useState } from "react";
import { EventBus } from "../../game/EventBus";
import { CombatEvent } from "../../utils/utils";
import styles from "./TurnTimer.module.scss";
import React from "react";

export default function TurnTimer()
{
	const [turnTime, setTurnTime] = useState<number>(0);
	const [turn, setTurn] = useState<number>(0);

	useEffect(() =>
	{
		function initTurnTime( playerTurnTime: number ) { setTurnTime(playerTurnTime); setTurn(prev => prev + 1) }
		EventBus.addListener(CombatEvent.initTurnTimer, initTurnTime);

		function endTurn() { setTurnTime(0); }
		EventBus.addListener(CombatEvent.attack, endTurn);

		function cleanup()
		{
			EventBus.removeListener(CombatEvent.initTurnTimer, initTurnTime);
			EventBus.removeListener(CombatEvent.attack, endTurn);
		}

		return () => cleanup();
	}, []);

	return <div key={turn} className={styles.turnTimer} style={ { '--turn-duration': `${turnTime}ms` } as React.CSSProperties } />
}
