import styles from "./Checkbox.module.scss"

interface ICheckboxProps
{
	ref?: React.RefObject<HTMLInputElement | null>;
	label: string;
	id: string;
	setting: boolean;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	extraStyling?: string;
}

export default function Checkbox( { ref, label, id, setting, onChange, extraStyling = "" } : ICheckboxProps )
{
	return (
		<div className={`${styles.checkbox} ${extraStyling}`}>
			<label htmlFor={id}>{label}</label>
			<input
				ref={ref}
				id={id}
				type="checkbox"
				defaultChecked={setting}
				onChange={onChange}/>
		</div>
	);
}
