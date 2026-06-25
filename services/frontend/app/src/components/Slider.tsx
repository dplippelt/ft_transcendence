import { useState } from "react";
import styles from "./Slider.module.scss"

interface SliderProps
{
	ref?: React.RefObject<HTMLInputElement | null>;
	label: string;
	id: string;
	min: number;
	max: number;
	setting: number;
}

export default function Slider( { ref, label, id, min, max, setting } : SliderProps )
{
	const [value, setValue] = useState<number>(setting);

	function clampValue( nextValue: number )
	{
		return Math.min(max, Math.max(min, nextValue));
	}

	function handleChange( e: React.ChangeEvent<HTMLInputElement> )
	{
		const nextValue = Number(e.target.value);

		if (Number.isNaN(nextValue)) {
			return;
		}

		return setValue(clampValue(nextValue));
	}

	return (
		<div className={styles.slider}>
			<label htmlFor={id}>{label}</label>
			<div className={styles.track}>
				<input
					ref={ref}
					type="range"
					min={min}
					max={max}
					value={value}
					onChange={handleChange}/>
				<input className={styles.numberInput}
					id={id}
					type="number"
					min={min}
					max={max}
					value={value}
					onChange={handleChange}/>
			</div>
		</div>
	);
}
