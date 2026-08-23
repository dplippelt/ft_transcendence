import styles from "./GameBackground.module.scss";

interface IGameBackground
{
	inCombat: boolean;
}

export default function GameBackground( { inCombat } : IGameBackground )
{
	return (
		<>
			{ inCombat
			? <div className={styles.combatBackground} />
			: <div className={styles.dungeonBackground} /> }
		</>
	);
}
