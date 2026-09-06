import React from "react";
import styles from "./Popup.module.scss";

interface IPopup
{
	children: React.ReactNode;
	extraStyling?: string;
	backdropStyling?: string;
}

export default function Popup( { children, extraStyling="", backdropStyling="" } : IPopup )
{
	return (
		<div className={`${styles.backdrop} ${backdropStyling}`}>
			<div className={`${styles.popup} ${extraStyling}`}>
				{children}
			</div>
		</div>
	);
}
