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
					onChange={ (e) => setValue(Number(e.target.value))}/>
				<input
					id={id}
					style={{marginLeft: "1rem"}}
					type="number"
					min={min}
					max={max}
					value={value}
					onChange={ (e) => setValue(Number(e.target.value))}/>
			</div>
		</div>
	);
}
