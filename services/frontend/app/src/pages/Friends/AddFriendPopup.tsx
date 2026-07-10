import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import ErrorText from "../../components/ErrorText";
import { ErrorType } from "../../utils/utils";
import { TextInput } from "../../components/TextInput";
import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { PopupType } from "./enums";
import { getValidUsername, isErrorType } from "../../utils/usernameCheck";

interface IAddFriendPopup
{
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function AddFriendPopup( { setPopuptype } : IAddFriendPopup )
{
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const [username, setUsername] = useState<string>("");
	const { user, ...userFunc } = useUser();

	function usernameCheck()
	{
		const result: string | ErrorType = getValidUsername(username);
		if ( isErrorType(result) )
			return setError(result);

		const validUsername = result;

		if ( validUsername === user.username )
			return setError(ErrorType.cannotAddSelf)

		// Mock username checks
		if ( validUsername.length === 1 )
			return setError(ErrorType.userDoesNotExist);
		if ( validUsername in user.friends )
			return setError(ErrorType.userAlreadyFriend);

		userFunc.addFriend(username);
		setPopuptype(PopupType.none);
	}

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error}/> }
			<TextInput label="Add new friend:" placeholder="Friend's username" setter={setUsername} id="newUsername" />
			<PopupButtons>
				<MossButton label="Add" onClick={ usernameCheck } />
				<MossButton label="Cancel" onClick={ () => setPopuptype(PopupType.none) } />
			</PopupButtons>
		</>
	)
}
