import React, { useEffect, useRef, useState } from "react";
import styles from "./Bar.module.scss";
import { emitEveryFrame, emitWhenReady, EventBus } from "../../game/EventBus";
import { CombatEvent } from "../../utils/utils";

interface IHPBar
{
	className: string;
	maxHP: number;
	currHP: number;
}

interface IMPBar
{
	maxMP: number;
	currMP: number;
}

function HPBar( { className, maxHP, currHP } : IHPBar )
{
	const fillPercentage = maxHP > 0 ? Math.min(100, (currHP / maxHP) * 100) : 0;

	return (
		<div className={className}>
			<div className={styles.text}>{`${currHP} / ${maxHP}`}</div>
			<div className={styles.hpBarFill} style={ { '--fill-percentage': `${fillPercentage}%` } as React.CSSProperties } />
		</div>
	);
}

function MPBar( { maxMP, currMP } : IMPBar )
{
	const fillPercentage = maxMP > 0 ? Math.min(100, (currMP / maxMP) * 100) : 0;

	return (
		<div className={styles.playerMpBar}>
			<div className={styles.text}>{`${currMP} / ${maxMP}`}</div>
			<div className={styles.mpBarFill} style={ { '--fill-percentage': `${fillPercentage}%` } as React.CSSProperties } />
		</div>
	);
}

export function PlayerHPBar()
{
	const [maxHP, setMaxHP] = useState<number>(0);
	const [currHP, setCurrHP] = useState<number>(0);
	const stopPollingRef = useRef<(() => void) | null>(null);

	useEffect(() =>
	{
		function initPlayerHP( maxPlayerHP: number ) {
			setMaxHP(maxPlayerHP);
			setCurrHP(maxPlayerHP);
			stopPollingRef.current = emitEveryFrame(CombatEvent.getCurrPlayerHp);
		}
		EventBus.addListener(CombatEvent.initPlayerHP, initPlayerHP);

		function updatePlayerHP( currPlayerHP: number ) { setCurrHP(currPlayerHP >= 0 ? currPlayerHP : 0); }
		EventBus.addListener(CombatEvent.updatePlayerHP, updatePlayerHP);

		emitWhenReady(CombatEvent.getInitPlayerHp);

		function cleanup() {
			EventBus.removeListener(CombatEvent.initPlayerHP, initPlayerHP);
			EventBus.removeListener(CombatEvent.updatePlayerHP, updatePlayerHP);
			stopPollingRef.current?.();
		}

		return () => cleanup();
	}, []);

	return <HPBar className={styles.playerHpBar} maxHP={maxHP} currHP={currHP} />;
}

export function EnemyHPBar()
{
	const [maxHP, setMaxHP] = useState<number>(0);
	const [currHP, setCurrHP] = useState<number>(0);
	const stopPollingRef = useRef<(() => void) | null>(null);

	useEffect(() =>
	{
		function initEnemyHP( maxEnemyHP: number ) {
			setMaxHP(maxEnemyHP);
			setCurrHP(maxEnemyHP);
			stopPollingRef.current = emitEveryFrame(CombatEvent.getCurrEnemyHp);
		}
		EventBus.addListener(CombatEvent.initEnemyHP, initEnemyHP);

		function updateEnemyHP( currEnemyHP: number ) { setCurrHP(currEnemyHP >= 0 ? currEnemyHP : 0); }
		EventBus.addListener(CombatEvent.updateEnemyHP, updateEnemyHP);

		emitWhenReady(CombatEvent.getInitEnemyHp);

		function cleanup() {
			EventBus.removeListener(CombatEvent.initEnemyHP, initEnemyHP);
			EventBus.removeListener(CombatEvent.updateEnemyHP, updateEnemyHP);
			stopPollingRef.current?.();
		}

		return () => cleanup();
	}, []);

	return <HPBar className={styles.enemyHpBar} maxHP={maxHP} currHP={currHP} />;
}

export function PlayerMPBar()
{
	const [maxMP, setMaxMP] = useState<number>(0);
	const [currMP, setCurrMP] = useState<number>(0);
	const stopPollingRef = useRef<(() => void) | null>(null);

	useEffect(() =>
	{
		function initPlayerMP( maxPlayerMP: number ) {
			setMaxMP(maxPlayerMP);
			setCurrMP(maxPlayerMP);
			stopPollingRef.current = emitEveryFrame(CombatEvent.getCurrPlayerMp);
		}
		EventBus.addListener(CombatEvent.initPlayerMP, initPlayerMP);

		function updatePlayerMP( currPlayerMP: number ) { setCurrMP(currPlayerMP >= 0 ? currPlayerMP : 0); }
		EventBus.addListener(CombatEvent.updatePlayerMP, updatePlayerMP);

		emitWhenReady(CombatEvent.getInitPlayerMp);

		function cleanup() {
			EventBus.removeListener(CombatEvent.initPlayerMP, initPlayerMP);
			EventBus.removeListener(CombatEvent.updatePlayerMP, updatePlayerMP);
			stopPollingRef.current?.();
		}

		return () => cleanup();
	}, []);

	return <MPBar maxMP={maxMP} currMP={currMP} />;
}
