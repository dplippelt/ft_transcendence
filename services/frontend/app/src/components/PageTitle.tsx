import styles from "./PageTitle.module.scss"

export function AppTitle()
{
	return <div className={styles.appTitle}>Math Crawler</div>
}

export function MenuTitle( { title } : { title: string } )
{
	return <div className={styles.menuTitle}>{title}</div>
}
