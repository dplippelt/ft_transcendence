import { useEffect, useState } from "react";
import { EventBus } from "../../game/EventBus";
import { CombatEvent } from "../../utils/utils";
import styles from "./CombatButtons.module.scss";

interface ICombatButton
{
    disabled: boolean;
	onClick?: () => void;
	extraStyling?: string;
}

function CombatButton( { disabled, onClick, extraStyling="" } : ICombatButton )
{
	return <button className={`${styles.combatButton} ${extraStyling}`} type="button" disabled={disabled} onClick={onClick} />;
}

export function AttackButton()
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

	return <CombatButton extraStyling={styles.attackButton} disabled={disabled} onClick={() => EventBus.emit(CombatEvent.attack)} />
}

export function DrawButton()
{
    const [disabled, setDisabled] = useState<boolean>(false);

    function handleClick() {
        if (disabled) {
            return ;
        }
        setDisabled(true);
        EventBus.emit(CombatEvent.draw);
    }

    useEffect(() => 
    {
        function enableDraw() { setDisabled(false); }
        EventBus.addListener(CombatEvent.completeFillHand, enableDraw);

        function cleanup() {
            EventBus.removeListener(CombatEvent.completeFillHand, enableDraw);
        }

        return () => cleanup();
    }, [])

	return <CombatButton extraStyling={styles.drawButton} disabled={disabled} onClick={handleClick} />
}
