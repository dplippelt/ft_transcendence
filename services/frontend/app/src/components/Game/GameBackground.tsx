import styles from "./GameBackground.module.scss";

interface IGameBackground
{
	inCombat: boolean;
}

export default function GameBackground( { inCombat } : IGameBackground )
{
	if ( inCombat )
		return <div className={styles.combatBackground} />;
	return <div className={styles.dungeonBackground} />;
}
