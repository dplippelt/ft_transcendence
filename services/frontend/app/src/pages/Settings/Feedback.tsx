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
}

export default function Feedback( { feedback } : IFeedback )
{
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
