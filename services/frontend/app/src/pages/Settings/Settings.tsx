import styles from "./Settings.module.scss";
import { useEffect, useState } from "react";
import type React from "react";
import { MenuTitle } from "../../components/PageTitle";
import { BottomButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { BackButton, BottomButton } from "../../components/Buttons";
import { MobilePosition, RoutePath } from "../../utils/utils";
import SideBar from "../../components/SideBar";
import { useOperators } from "../../contexts/OperatorContext";
import OperatorSettings from "../../components/OperatorSettings";
import { ErrorType } from "../../utils/errors";
import ErrorText from "../../components/ErrorText";
import Feedback, { FeedbackType } from "./Feedback";

interface ISettingsWindow
{
	setOps: React.Dispatch<React.SetStateAction<number>>;
	feedback: FeedbackType;
	ops: number;
}

interface IButtons
{
	setResetKey: React.Dispatch<React.SetStateAction<number>>;
	setFeedback: React.Dispatch<React.SetStateAction<FeedbackType>>;
	ops: number;
	canApply: boolean;
}

function SettingsWindow( { setOps, feedback, ops } : ISettingsWindow )
{
	return (
		<div className={styles.settingsWindow}>
			<div className={styles.query}>Select operators to include in game</div>
			<OperatorSettings setOps={setOps} />
			{ ops === 0 && <ErrorText error={ErrorType.noOperatorsSelected} extraStyling={styles.errorText} /> }
			{ feedback !== FeedbackType.none && <Feedback feedback={feedback} /> }
		</div>
	);
}

function Buttons( { setResetKey, setFeedback, ops, canApply } : IButtons )
{
	const { saveOperators, resetOperators } = useOperators();

	function resetSettings()
	{
		resetOperators();
		setFeedback(FeedbackType.reset);
		setResetKey(prev => prev + 1);
	}

	function applySettings()
	{
		setFeedback(FeedbackType.applied);
		saveOperators(ops)
	}

	return (
		<BottomButtons>
			<BackButton path={RoutePath.mainMenu} />
			<BottomButton label="Reset Defaults" onClick={resetSettings} mobilePosition={MobilePosition.top} />
			<BottomButton label="Apply" onClick={applySettings} disabled={!canApply} />
		</BottomButtons>
	);
}

export default function Settings()
{
	const { operators } = useOperators();

	const [resetKey, setResetKey] = useState(0);
	const [ops, setOps] = useState<number>(operators);
	const [feedback, setFeedback] = useState<FeedbackType>(FeedbackType.none);
	const canApply: boolean = ops ? ops !== operators : false;

	useEffect(() =>
	{
		setOps(operators);
	}, [operators, resetKey])

	function handleOpsChange( action: React.SetStateAction<number> )
	{
		setOps(action);
		setFeedback(FeedbackType.none);
	}

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Settings"/>
				<SettingsWindow key={resetKey} setOps={handleOpsChange} feedback={feedback} ops={ops} />
				<Buttons setResetKey={setResetKey} setFeedback={setFeedback} ops={ops} canApply={canApply} />
				<SideBar />
			</Page>
		</>
	);
}
