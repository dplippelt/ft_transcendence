import React, { useEffect, useState } from "react";
import styles from "./Bar.module.scss";
import { EventBus } from "../../game/EventBus";
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
	return (
		<div className={className}>
			<div className={styles.text}>{`${currHP} / ${maxHP}`}</div>
			<div className={styles.hpBarFill} style={ { '--fill-percentage': `${currHP / maxHP * 100}%` } as React.CSSProperties } />
		</div>
	);
}

function MPBar( { maxMP, currMP } : IMPBar )
{
	return (
		<div className={styles.playerMpBar}>
			<div className={styles.text}>{`${currMP} / ${maxMP}`}</div>
			<div className={styles.mpBarFill} style={ { '--fill-percentage': `${currMP / maxMP * 100}%` } as React.CSSProperties } />
		</div>
	);
}

export function PlayerHPBar()
{
	const [maxHP, setMaxHP] = useState<number>(0);
	const [currHP, setCurrHP] = useState<number>(0);

	useEffect(() =>
	{
		function initPlayerHP( maxPlayerHP: number ) { setMaxHP(maxPlayerHP); setCurrHP(maxPlayerHP); }
		EventBus.addListener(CombatEvent.initPlayerHP, initPlayerHP);

		function updatePlayerHP( currPlayerHP: number ) { setCurrHP(currPlayerHP >= 0 ? currPlayerHP : 0); }
		EventBus.addListener(CombatEvent.updatePlayerHP, updatePlayerHP);

		function cleanup() {
			EventBus.removeListener(CombatEvent.initPlayerHP, initPlayerHP);
			EventBus.removeListener(CombatEvent.updatePlayerHP, updatePlayerHP);
		}

		return () => cleanup();
	}, []);

	return <HPBar className={styles.playerHpBar} maxHP={maxHP <= 0 ? 1 : maxHP} currHP={currHP} />;
}

export function EnemyHPBar()
{
	const [maxHP, setMaxHP] = useState<number>(0);
	const [currHP, setCurrHP] = useState<number>(0);

	useEffect(() =>
	{
		function initEnemyHP( maxEnemyHP: number ) { setMaxHP(maxEnemyHP); setCurrHP(maxEnemyHP); }
		EventBus.addListener(CombatEvent.initEnemyHP, initEnemyHP);

		function updateEnemyHP( currEnemyHP: number ) { setCurrHP(currEnemyHP >= 0 ? currEnemyHP : 0); }
		EventBus.addListener(CombatEvent.updateEnemyHP, updateEnemyHP);

		function cleanup() {
			EventBus.removeListener(CombatEvent.initEnemyHP, initEnemyHP);
			EventBus.removeListener(CombatEvent.updateEnemyHP, updateEnemyHP);
		}

		return () => cleanup();
	}, []);

	return <HPBar className={styles.enemyHpBar} maxHP={maxHP <= 0 ? 1 : maxHP} currHP={currHP} />;
}

export function PlayerMPBar()
{
	const [maxMP, setMaxMP] = useState<number>(0);
	const [currMP, setCurrMP] = useState<number>(0);

	useEffect(() =>
	{
		function initPlayerMP( maxPlayerMP: number ) { setMaxMP(maxPlayerMP); setCurrMP(maxPlayerMP); }
		EventBus.addListener(CombatEvent.initPlayerMP, initPlayerMP);

		function updatePlayerMP( currPlayerMP: number ) { setCurrMP(currPlayerMP >= 0 ? currPlayerMP : 0); }
		EventBus.addListener(CombatEvent.updatePlayerMP, updatePlayerMP);

		function cleanup() {
			EventBus.removeListener(CombatEvent.initPlayerMP, initPlayerMP);
			EventBus.removeListener(CombatEvent.updatePlayerMP, updatePlayerMP);
		}

		return () => cleanup();
	}, []);

	return <MPBar maxMP={maxMP <= 0 ? 1 : maxMP} currMP={currMP} />;
}
