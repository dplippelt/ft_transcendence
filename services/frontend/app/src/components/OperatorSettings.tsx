import React from "react";
import { OperatorBit } from "../utils/utils";
import Checkbox from "./Checkbox";
import styles from "./OperatorSettings.module.scss";
import { useOperators } from "../contexts/OperatorContext";

interface IOperatorSettings
{
	setOps: React.Dispatch<React.SetStateAction<number>>;
	extraStyling?: string;
}

export default function OperatorSettings( { setOps, extraStyling } : IOperatorSettings )
{
	const { operators } = useOperators();

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

	return (
		<>
			<div className={`${styles.operators} ${extraStyling}`}>
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
		</>
	);
}
