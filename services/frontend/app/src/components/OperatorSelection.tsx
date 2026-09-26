import { useNavigate } from "react-router-dom";
import { buildRoute, OperatorBit, PopupType, RouteParamKey, RoutePath } from "../utils/utils";
import { useState } from "react";
import { ErrorType } from "../utils/errors";
import ErrorText from "./ErrorText";
import Checkbox from "./Checkbox";
import { PopupButtons } from "./ButtonContainers";
import { MossButton } from "./Buttons";
import styles from "./OperatorSelection.module.scss";
import { useOperators } from "../contexts/OperatorContext";

interface IOperatorSelection
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function OperatorSelection( { setPopupType } : IOperatorSelection )
{
	const navigate = useNavigate();
  const { operators, getOperatorsMask, saveOperators } = useOperators();

	const [ops, setOps] = useState<number>(operators);
	const [error, setError] = useState<ErrorType>(ErrorType.none);

	function addOperator( op: OperatorBit )
	{
		setOps(prev => prev |= op);
	}

	function removeOperator( op: OperatorBit )
	{
		setOps(prev => prev &= ~op );
	}

	function handleChange( e: React.ChangeEvent<HTMLInputElement>, op: OperatorBit )
	{
		if ( e.target.checked ) { addOperator(op); }
		else { removeOperator(op); }
	}

	function handleStart()
	{
		if ( !operators )
		{
			setError(ErrorType.noOperatorsSelected);
			return;
		}
		setError(ErrorType.none);
		setPopupType(PopupType.none);
		saveOperators(ops);
		navigate(buildRoute(RoutePath.game, { [RouteParamKey.ops]: getOperatorsMask() }));
	}

	function handleCancel()
	{
		setPopupType(PopupType.none);
	}

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error} /> }
			<div className={styles.query}>Select operators to include in game</div>
			<div className={styles.operators}>
				<Checkbox
					label="Plus"
					id="plus"
					setting={!!(operators & OperatorBit.plus)}
					onChange={ (e) => handleChange(e, OperatorBit.plus) }
					extraStyling={styles.checkbox}
				/>
				<Checkbox
					label="Minus"
					id="minus"
					setting={!!(operators & OperatorBit.minus)}
					onChange={ (e) => handleChange(e, OperatorBit.minus) }
					extraStyling={styles.checkbox}
				/>
				<Checkbox
					label="Multiply"
					id="multiply"
					setting={!!(operators & OperatorBit.multiply)}
					onChange={ (e) => handleChange(e, OperatorBit.multiply) }
					extraStyling={styles.checkbox}
				/>
				<Checkbox
					label="Modulo"
					id="modulo"
					setting={!!(operators & OperatorBit.modulo)}
					onChange={ (e) => handleChange(e, OperatorBit.modulo) }
					extraStyling={styles.checkbox}
				/>
				<Checkbox
					label="Divide"
					id="divide"
					setting={!!(operators & OperatorBit.divide)}
					onChange={ (e) => handleChange(e, OperatorBit.divide) }
					extraStyling={styles.checkbox}
				/>
			</div>
			<PopupButtons>
				<MossButton label="Cancel" onClick={handleCancel} />
				<MossButton label="Start" onClick={handleStart} />
			</PopupButtons>
		</>
	)
}
