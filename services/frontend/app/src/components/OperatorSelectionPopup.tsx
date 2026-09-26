import { useNavigate } from "react-router-dom";
import { getPathToGame, PopupType } from "../utils/utils";
import { useState } from "react";
import { ErrorType } from "../utils/errors";
import ErrorText from "./ErrorText";
import { PopupButtons } from "./ButtonContainers";
import { MossButton } from "./Buttons";
import styles from "./OperatorSelectionPopup.module.scss";
import { useOperators } from "../contexts/OperatorContext";
import OperatorSettings from "./OperatorSettings";

interface IOperatorSelectionPopup
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function OperatorSelectionPopup( { setPopupType } : IOperatorSelectionPopup )
{
	const navigate = useNavigate();
  const { operators, saveOperators } = useOperators();

	const [ops, setOps] = useState<number>(operators);
	const [error, setError] = useState<ErrorType>(ErrorType.none);

	function handleStart()
	{
		if ( !ops )
		{
			setError(ErrorType.noOperatorsSelected);
			return;
		}
		setError(ErrorType.none);
		setPopupType(PopupType.none);
		saveOperators(ops);
		navigate(getPathToGame(ops));
	}

	function handleCancel()
	{
		setPopupType(PopupType.none);
	}

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error} /> }
			<div className={styles.query}>Select operators to include in game</div>
			<OperatorSettings setOps={setOps} extraStyling={styles.checkbox} />
			<PopupButtons>
				<MossButton label="Cancel" onClick={handleCancel} />
				<MossButton label="Start" onClick={handleStart} />
			</PopupButtons>
		</>
	)
}

