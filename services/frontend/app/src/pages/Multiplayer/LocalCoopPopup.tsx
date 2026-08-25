import { useState } from "react";
import { PopupType, RouteParam, RoutePath } from "../../utils/utils";
import { ErrorType, isErrorType } from "../../utils/errors";
import { useNavigate } from "react-router-dom";
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
	const navigate = useNavigate();
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

		// TODO: navigate to game and pass relevant info to game.
		// Coop player does not have their progress saved, no need to link to an account if they have one.
		// Just any username - no need to check for overlap with existing usernames in backend.

		// TODO: might want to add an intermediate screen showing controls for player 1 and player 2

		void validCoopUsername;
		void user.username;

		navigate(RoutePath.game + RouteParam.coop);
		setPopupType(PopupType.none);
	}

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error}/> }
			<TextInput label="Player 2 username:" placeholder="New username" setter={setCoopPlayerName} id="newCoopUsername" />
			<PopupButtons>
				<MossButton label="Start game" onClick={ usernameCheck } />
				<MossButton label="Cancel" onClick={ () => setPopupType(PopupType.none) } />
			</PopupButtons>
		</>
	)
}
