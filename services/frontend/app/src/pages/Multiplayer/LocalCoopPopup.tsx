import { useState } from "react";
import { PopupType } from "../../utils/utils";
import { ErrorType, isErrorType } from "../../utils/errors";
import ErrorText from "../../components/ErrorText";
import { TextInput } from "../../components/TextInput";
import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { getValidUsername } from "../../utils/usernameCheck";
import { useCurrentUser } from "../../contexts/AuthContext";

interface ILocalCoopPopup
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function LocalCoopPopup( { setPopupType } : ILocalCoopPopup )
{
	// const navigate = useNavigate();
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const [coopPlayerName, setCoopPlayerName] = useState<string>("");
	const user = useCurrentUser();

	function usernameCheck()
	{
		const result: string | ErrorType = getValidUsername(coopPlayerName);
		if ( isErrorType(result) )
			return setError(result);

		const validCoopUsername = result;

		if ( validCoopUsername === user.username )
			return setError(ErrorType.usernameCannotBeTheSame);

		// TODO: might want to add an intermediate screen showing controls for player 1 and player 2 (part of how to play issue)

		// NOTE: nothing actually uses these usernames in coop. My initial idea was to pass them to
		// the game so they could be displayed above the avatars' heads but we decided against this
		// in a meeting from a while back. The only reason I've left the LocalCoopPopup in
		// and ask for coop/player2 username is just in case we want to do something with it later after all.

		// TODO: either pass these usernames to the game and display them, or get rid of LocalCoopPopup entirely
		// and skip to the OperatorSelectionPopup straight away
		void validCoopUsername;
		void user.username;

		setPopupType(PopupType.operatorSelection);
	}

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error}/> }
			<TextInput label="Player 2 username:" placeholder="New username" setter={setCoopPlayerName} id="newCoopUsername" />
			<PopupButtons>
				<MossButton label="Ok" onClick={ usernameCheck } />
				<MossButton label="Cancel" onClick={ () => setPopupType(PopupType.none) } />
			</PopupButtons>
		</>
	)
}
