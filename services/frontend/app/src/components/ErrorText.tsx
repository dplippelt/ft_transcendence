import { errorMsg, type ErrorType } from "../utils/errors"
import styles from "./ErrorText.module.scss"

export default function ErrorText( { error } : { error: ErrorType } )
{
	return <div className={styles.errorText}>{ errorMsg(error) }</div>;
}
