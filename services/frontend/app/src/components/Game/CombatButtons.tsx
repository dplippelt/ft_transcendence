import { EventBus } from "../../game/EventBus";
import { CombatEvent } from "../../utils/utils";
import styles from "./CombatButtons.module.scss";

interface ICombatButton
{
	label: string;
	onClick?: () => void;
	extraStyling?: string;
	disabled?: boolean;
}

function CombatButton( { label, onClick, extraStyling="", disabled=false } : ICombatButton )
{
	return <button className={`${styles.combatButton} ${extraStyling}`} type="button" disabled={disabled} onClick={onClick}>{label}</button>;
}

export function AttackButton()
{
	return <CombatButton label="Attack" extraStyling={styles.attackButton} onClick={() => EventBus.emit(CombatEvent.attack)} />
}

export function DrawButton()
{
	return <CombatButton label="Draw" extraStyling={styles.drawButton} onClick={() => EventBus.emit(CombatEvent.draw)} />
}

export function ResetButton()
{
	return <CombatButton label="Reset" extraStyling={styles.resetButton} onClick={() => EventBus.emit(CombatEvent.reset)} />
}
