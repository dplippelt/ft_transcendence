import { errorMsg, type AccountError } from "../utils/utils"
import styles from "./ErrorText.module.scss"

export default function ErrorText( { error } : { error: AccountError } )
{
	return <div className={styles.errorText}>{ errorMsg(error) }</div>;
}
