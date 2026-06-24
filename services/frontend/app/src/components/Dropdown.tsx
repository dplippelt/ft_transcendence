import styles from "./Dropdown.module.scss"

interface IDropdown
{
	ref?: React.RefObject<HTMLSelectElement | null>;
	label: string;
	id: string;
	options: { value: string, label:string }[];
	setting: string;
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function Dropdown( { ref, label, id, options, setting, onChange } : IDropdown )
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
