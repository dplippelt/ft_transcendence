import { errorMsg, type ErrorType } from "../utils/errors"
import styles from "./ErrorText.module.scss"

interface IErrorText
{
  error: ErrorType;
  extraStyling?: string;
}

export default function ErrorText( { error, extraStyling } : IErrorText )
{
	return <div className={`${styles.errorText} ${extraStyling}`}>{ errorMsg(error) }</div>;
}
