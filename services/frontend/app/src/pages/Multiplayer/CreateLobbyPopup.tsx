import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PopupType, RoutePath } from "../../utils/utils";
import {
	ErrorType,
	isErrorType,
	mapLobbyApiError,
} from "../../utils/errors";
import { getValidLobbyName } from "../../utils/lobbyNameCheck";

import { useLobbies } from "../../contexts/LobbiesContext";

import ErrorText from "../../components/ErrorText";
import { TextInput } from "../../components/TextInput";
import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";

interface ICreateLobbyPopup
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function CreateLobbyPopup( { setPopupType } : ICreateLobbyPopup )
{
	const navigate = useNavigate();
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const [lobbyname, setLobbyName] = useState<string>("");
	const { createLobby } = useLobbies();

	async function lobbyNameCheck()
    {
        const result = getValidLobbyName(lobbyname);

        if (isErrorType(result))
        {
            setError(result);
            return;
        }

        try
        {
            const lobby = await createLobby(result);

            setPopupType(PopupType.none);

            navigate(RoutePath.mpLobby + `/${lobby.id}`,);
        }
        catch (err)
        {
            setError(mapLobbyApiError(err));
        }
    }

    return (
        <>
            {error !== ErrorType.none && <ErrorText error={error} />}
            <TextInput label="Lobby name:" placeholder="New lobby name" setter={setLobbyName} id="newLobbyName" />
            <PopupButtons>
                <MossButton label="Create" onClick={lobbyNameCheck} />
                <MossButton label="Cancel" onClick={() => setPopupType(PopupType.none)} />
            </PopupButtons>
        </>
    );
}
