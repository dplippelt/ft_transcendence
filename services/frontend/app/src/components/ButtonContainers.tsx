import React from "react";
import styles from "./ButtonContainers.module.scss";

export function MenuButtons( { children } : { children : React.ReactNode } )
{
	return (
		<div className={styles.menuButtons}>
			{children}
		</div>
	);
}

export function BottomButtons( { children } : { children : React.ReactNode } )
{
	return (
		<div className={styles.bottomButtons}>
			{children}
		</div>
	);
}
