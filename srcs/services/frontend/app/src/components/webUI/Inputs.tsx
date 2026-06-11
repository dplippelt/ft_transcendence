import { useState } from "react";
import styles from "./Inputs.module.scss";

type CheckboxProps =
{
	ref?: React.RefObject<HTMLInputElement | null>,
	label: string,
	id: string,
	setting: boolean,
}

type SliderProps =
{
	ref?: React.RefObject<HTMLInputElement | null>,
	label: string,
	id: string,
	min: number,
	max: number,
	setting: number,
}

type DropdownProps =
{
	ref?: React.RefObject<HTMLSelectElement | null>,
	label: string,
	id: string,
	options: { value: string, label:string }[],
	setting: string,
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function Checkbok( { ref, label, id, setting } : CheckboxProps )
{
	return (
		<div className={styles.checkbox}>
			<label htmlFor={id}>{label}</label>
			<input
				ref={ref}
				id={id}
				type="checkbox"
				defaultChecked={setting}/>
		</div>
	);
}

export function Slider( { ref, label, id, min, max, setting } : SliderProps )
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

export function Dropdown( { ref, label, id, options, setting, onChange } : DropdownProps )
{
	return (
		<div className={styles.dropdown}>
			<label htmlFor={id}>{label}</label>
			<select
				ref={ref}
				id={id}
				defaultValue={setting}
				onChange={onChange}
			>
				{ options.map((opt) =>
					<option key={opt.value} value={opt.value}>{opt.label}</option> ) }
			</select>
		</div>
	);
}
