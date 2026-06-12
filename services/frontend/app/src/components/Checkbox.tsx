import styles from "./Checkbox.module.scss"

type CheckboxProps =
{
	ref?: React.RefObject<HTMLInputElement | null>,
	label: string,
	id: string,
	setting: boolean,
}

export default function Checkbox( { ref, label, id, setting } : CheckboxProps )
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
