import styles from "./Popup.module.scss";

export default function Popup( { children } : { children: React.ReactNode } )
{
	return (
		<div className={styles.backdrop}>
			<div className={styles.popup}>
				{children}
			</div>
		</div>
	);
}
