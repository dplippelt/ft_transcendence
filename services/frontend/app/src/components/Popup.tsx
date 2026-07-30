import React from "react";
import styles from "./Popup.module.scss";

interface IPopup
{
	children: React.ReactNode;
	extraStyling?: string;
}

export default function Popup( { children, extraStyling="" } : IPopup )
{
	return (
		<div className={styles.backdrop}>
			<div className={`${styles.popup} ${extraStyling}`}>
				{children}
			</div>
		</div>
	);
}
