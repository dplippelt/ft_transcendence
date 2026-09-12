import type React from "react";
import styles from "./TargetNumbers.module.scss";
import { useEffect, useRef/* , useState */ } from "react";
// import { emitEveryFrame, emitWhenReady, EventBus } from "../../game/EventBus";
// import { CombatEvent } from "../../utils/utils";

interface Position
{
	x: number;
	y: number;
}

const numberPositions: Position[][] =
[
	[ { x: 0, y: 0 } ],
	[ { x: -100, y: 30 }, { x: 100, y: 30 } ],
	[ { x: -100, y: 30 }, { x: 0, y: -40 }, { x: 100, y: 30 } ],
];

interface ITargetNumber
{
	x: number;
	y: number;
	value: number;
}

function TargetNumber( { x, y, value } : ITargetNumber )
{
	const ref = useRef<HTMLDivElement | null>(null);
	const duration = useRef<number>(2.5 + Math.random() * 2).current;

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

		function handleAnimIteration() { randomizeDrift(element!); }
		element.addEventListener('animationiteration', handleAnimIteration);

		function cleanup()
		{
			element?.removeEventListener('animationiteration', handleAnimIteration);
		}

		return () => cleanup();
	}, []);

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
			{value}
		</div>
	);
}

export default function TargetNumbers()
{
	/* Scaffolding for initializing/getting current set of target numbers from Phaser */

	// const [numbers, setNumbers] = useState<number[] | null>(null);
	// const stopPollingRef = useRef<(() => void) | null>(null);

	// useEffect(() =>
	// {
	// 	function initNumbers( numbers: number[] ) {
	// 		setNumbers(numbers);
	// 		stopPollingRef.current = emitEveryFrame(CombatEvent.getCurrTargetNumbers);
	// 	}
	// 	EventBus.addListener(CombatEvent.initTargetNumbers, initNumbers);

	// 	function updateNumbers( numbers: number[] ) { setNumbers(numbers); }
	// 	EventBus.addListener(CombatEvent.updateTargetNumbers, updateNumbers);

	// 	emitWhenReady(CombatEvent.getInitTargetNumbers);

	// 	function cleanup() {
	// 		EventBus.removeListener(CombatEvent.initTargetNumbers, initNumbers);
	// 		EventBus.removeListener(CombatEvent.getInitTargetNumbers, updateNumbers);
	// 		stopPollingRef.current?.();
	// 	}

	// 	return () => cleanup();
	// }, []);

	// This 'numbers' variable mocks the above commented state variable for now
	const numbers: number[] | null = [4551, 2155, 8188];

	if ( numbers === null )
		return null;

	const nNumbers = numbers.length;

	if ( nNumbers < 1 || nNumbers > numberPositions.length )
	{
		console.error(`Invalid number of target values: ${nNumbers}`);
		return null;
	}

	const positions = numberPositions[nNumbers - 1]

	return (
		<div className={styles.targetNumbers}>
			{ numbers.map((value, idx) => (
				<TargetNumber key={idx} x={positions[idx].x} y={positions[idx].y} value={value} />
			)) }
		</div>
	);
}
