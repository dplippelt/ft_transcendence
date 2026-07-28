import ErrorText from "./ErrorText";
import { PopupButtons } from "./ButtonContainers";
import { MossButton } from "./Buttons";
import styles from "./ErrorPopup.module.scss";
import { useError } from "../contexts/ErrorContext";

export default function ErrorPopup()
{
	const { error, resetError } = useError();

	return (
		<>
			<ErrorText error={error} />
			<PopupButtons>
				<MossButton label="Ok" onClick={resetError} extraStyling={styles.button} />
			</PopupButtons>
		</>
	)
}
