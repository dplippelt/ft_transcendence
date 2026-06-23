import type React from "react";
import styles from "./Page.module.scss";

export default function Page( { children } : { children: React.ReactNode })
{
	return (
		<div className={styles.page}>
			{children}
		</div>
	);
}
