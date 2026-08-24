import { useState } from "react";
import { PopupType, RoutePath } from "../../utils/utils";
import { ErrorType, isErrorType } from "../../utils/errors";
import { getValidLobbyName } from "../../utils/lobbyNameCheck";
import { useLobbies } from "../../contexts/LobbiesContext";
import { useNavigate } from "react-router-dom";
import ErrorText from "../../components/ErrorText";
import { TextInput } from "../../components/TextInput";
import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { nanoid } from 'nanoid';
import { useCurrentUser } from "../../contexts/AuthContext";

interface ICreateLobbyPopup
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function CreateLobbyPopup( { setPopupType } : ICreateLobbyPopup )
{
	const navigate = useNavigate();
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const [lobbyname, setLobbyName] = useState<string>("");
	const user = useCurrentUser();
	const { lobbies, createLobby } = useLobbies();

	function lobbyNameCheck()
	{
		const result: string | ErrorType = getValidLobbyName(lobbyname);
		if ( isErrorType(result) )
			return setError(result);

		const validLobbyName = result;
		if ( Object.values(lobbies).some(lobbies => lobbies.lobbyName.toLowerCase() === validLobbyName.toLowerCase()) )
			return setError(ErrorType.lobbyNameAlreadyExists);

		const lobbyID = nanoid(8);

		createLobby(lobbyID, String(user.id), validLobbyName);
		setPopupType(PopupType.none);
		navigate(RoutePath.mpLobby + `/${lobbyID}`);
	}

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error}/> }
			<TextInput label="Lobby name:" placeholder="New lobby name" setter={setLobbyName} id="newLobbyName" />
			<PopupButtons>
				<MossButton label="Create" onClick={ lobbyNameCheck } />
				<MossButton label="Cancel" onClick={ () => setPopupType(PopupType.none) } />
			</PopupButtons>
		</>
	)
}
