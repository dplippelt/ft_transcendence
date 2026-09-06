import { useEffect, useState } from "react";
import { EventBus } from "../../game/EventBus";
import { CombatEvent } from "../../utils/utils";
import styles from "./CombatButtons.module.scss";

interface ICombatButton
{
	onClick?: () => void;
	extraStyling?: string;
}

function CombatButton( { onClick, extraStyling="" } : ICombatButton )
{
	const [disabled, setDisabled] = useState<boolean>(false);

	useEffect(() =>
	{
		function turnStart() { setDisabled(false); }
		EventBus.addListener(CombatEvent.initTurn, turnStart);

		function turnEnd() { setDisabled(true); }
		EventBus.addListener(CombatEvent.turnEnded, turnEnd);

		function cleanup () {
			EventBus.removeListener(CombatEvent.initTurn, turnStart);
			EventBus.removeListener(CombatEvent.turnEnded, turnEnd);
		}

		return () => cleanup();
	}, [])

	return <button className={`${styles.combatButton} ${extraStyling}`} type="button" disabled={disabled} onClick={onClick} />;
}

export function AttackButton()
{
	return <CombatButton extraStyling={styles.attackButton} onClick={() => EventBus.emit(CombatEvent.attack)} />
}

export function DrawButton()
{
	return <CombatButton extraStyling={styles.drawButton} onClick={() => EventBus.emit(CombatEvent.draw)} />
}
