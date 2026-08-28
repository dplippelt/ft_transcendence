import { EventBus } from "../../game/EventBus";
import { CombatEvent } from "../../utils/utils";
import styles from "./CombatButtons.module.scss";

// TODO: fix bug where attacking right at the end of your turn / start of enemy turn results in invalid enemy HP and the palyer being hit twice

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
	return <CombatButton label="" extraStyling={styles.attackButton} onClick={() => EventBus.emit(CombatEvent.attack)} />
}

export function DrawButton()
{
	return <CombatButton label="" extraStyling={styles.drawButton} onClick={() => EventBus.emit(CombatEvent.draw)} />
}

// export function ResetButton()
// {
// 	return <CombatButton label="Reset" extraStyling={styles.resetButton} onClick={() => EventBus.emit(CombatEvent.reset)} />
// }
