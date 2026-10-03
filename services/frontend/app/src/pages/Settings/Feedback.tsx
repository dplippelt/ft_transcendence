import ErrorText from "../../components/ErrorText";
import { ErrorType } from "../../utils/errors";
import styles from "./Feedback.module.scss";

export enum FeedbackType
{
	none,
	applied,
	reset,
}

interface IFeedback
{
	feedback: FeedbackType;
	ops: number;
}

export default function Feedback( { feedback, ops } : IFeedback )
{
	if ( !ops )
		return <ErrorText error={ErrorType.noOperatorsSelected} extraStyling={styles.errorText} />

	if ( feedback === FeedbackType.none )
		return;

	function msg() : string
	{
		switch ( feedback )
		{
			case FeedbackType.applied:
				return "Settings applied";
			case FeedbackType.reset:
				return "Default settings restored";
			default:
				return "";
		}
	}

	return <div className={styles.feedback}>{msg()}</div>
}
