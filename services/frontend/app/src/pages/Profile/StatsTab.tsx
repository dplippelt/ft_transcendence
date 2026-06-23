import styles from  "./StatsTab.module.scss";
import sharedStyle from "./Tab.module.scss";

interface StatProps
{
	label: string,
	score: number,
}

function Stat( { label, score } : StatProps )
{
	return (
		<>
			<div className={sharedStyle.profileLabel}>{`${label}:`}</div>
			<div className={styles.textInfo}>{score}</div>
		</>
	)
}

export default function StatsTab()
{
	return (
		<div className={styles.statsInfo}>
			<Stat label="Stat 1" score={16} />
			<Stat label="Stat 2" score={99999} />
			<Stat label="Stat 3" score={42} />
		</div>
	);
}
