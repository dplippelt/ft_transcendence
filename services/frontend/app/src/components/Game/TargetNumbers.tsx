import type React from "react";
import styles from "./TargetNumbers.module.scss";
import { useEffect, useRef, useState } from "react";
import { emitEveryFrame, emitWhenReady, EventBus } from "../../game/EventBus";
import { CombatEvent } from "../../utils/utils";
import { ExecuteCombo } from "../../game/gameobjects/CombatExecuteManager";

interface Position
{
	x: number;
	y: number;
}

const numberPositions: Position[][] =
[
	[ { x: 0, y: 0 } ],
	[ { x: -100, y: 30 }, { x: 100, y: 30 } ],
	[ { x: -100, y: 30 }, { x: 100, y: 30 }, { x: 0, y: -40 } ],
];

interface ITargetNumber
{
	x: number;
	y: number;
	combo: ExecuteCombo;
	value: number | null;
}

type Numbers = Record<ExecuteCombo, number | null>;

function TargetNumber( { x, y, combo, value } : ITargetNumber )
{
	const ref = useRef<HTMLDivElement | null>(null);
	const duration = useRef<number>(2.5 + Math.random() * 2).current;

	function setColor( element: HTMLDivElement )
	{
		switch (combo)
		{
			case ExecuteCombo.ONE:
				return element.style.setProperty('--color', "#008f00");
			case ExecuteCombo.TWO:
				return element.style.setProperty('--color', "#b8b800");
			case ExecuteCombo.THREE:
				return element.style.setProperty('--color', "#bf0000");
			default:
				return element.style.setProperty('--color', "#FFFF00");
		}
	}

	function randomizeDrift( element: HTMLDivElement )
	{
		function calcRandomDrift() : string
		{
			return `${(Math.random() * 2 - 1) * (3 + Math.random() * 10)}px`;
		}

		element.style.setProperty('--drift-x', calcRandomDrift());
		element.style.setProperty('--drift-y', calcRandomDrift());
	}

	useEffect(() =>
	{
		const element = ref.current;
		if ( !element )
			return;

		randomizeDrift(element);
		setColor(element);

		function handleAnimIteration() { randomizeDrift(element!); }
		element.addEventListener('animationiteration', handleAnimIteration);

		function cleanup()
		{
			element?.removeEventListener('animationiteration', handleAnimIteration);
		}

		return () => cleanup();
	}, []);

	if ( value === null )
		return;

	return (
		<div
			ref={ref}
			className={styles.targetNumber}
			style={ {
				'--x':`${x}px`,
				'--y':`${y}px`,
				'--duration': `${duration}s`,
			} as React.CSSProperties }
		>
			{parseFloat(value.toFixed(3))}
		</div>
	);
}

export default function TargetNumbers()
{
	const [numbers, setNumbers] = useState<Numbers | null>(null);
	const stopPollingRef = useRef<(() => void) | null>(null);

	useEffect(() =>
	{
		function initNumbers( numbers: Numbers ) {
			setNumbers(numbers);
			stopPollingRef.current = emitEveryFrame(CombatEvent.getCurrTargetNumbers);
		}
		EventBus.addListener(CombatEvent.initTargetNumbers, initNumbers);

		function updateNumbers( numbers: Numbers ) { setNumbers(numbers); }
		EventBus.addListener(CombatEvent.updateTargetNumbers, updateNumbers);

		emitWhenReady(CombatEvent.getInitTargetNumbers);

		function cleanup() {
			EventBus.removeListener(CombatEvent.initTargetNumbers, initNumbers);
			EventBus.removeListener(CombatEvent.updateTargetNumbers, updateNumbers);
			stopPollingRef.current?.();
		}

		return () => cleanup();
	}, []);

	if ( numbers === null )
		return null;

	const numbersArr = Object.entries(numbers).map(([combo, value]) => [Number(combo) as ExecuteCombo, value] as const);
	const filteredNumbers = numbersArr.filter(([, value]) => value !== null);
	const nNumbers = filteredNumbers.length;

	if ( nNumbers < 1 || nNumbers > numberPositions.length )
	{
		console.error(`Invalid number of target values: ${nNumbers}`);
		return null;
	}

	const positions = numberPositions[nNumbers - 1]

	return (
		<div className={styles.targetNumbers}>
			{ filteredNumbers.map(([combo, value], idx) => (
				<TargetNumber key={idx} x={positions[idx].x} y={positions[idx].y} combo={combo} value={value} />
			)) }
		</div>
	);
}
