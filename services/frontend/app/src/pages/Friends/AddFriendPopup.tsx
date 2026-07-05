import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import ErrorText from "../../components/ErrorText";
import { ErrorType } from "../../utils/utils";
import { TextInput } from "../../components/TextInput";
import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { PopupType } from "./enums";

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
		// Mock username check
		if ( username.length === 0 )
			return setError(ErrorType.usernameCannotBeEmpty);
		if ( username.length === 1 )
			return setError(ErrorType.userDoesNotExist);
		if ( username in user.friends )
			return setError(ErrorType.userAlreadyFriend);

		userFunc.addFriend(username);
		setPopuptype(PopupType.none);
	}

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error}/> }
			<TextInput label="Add new friend:" placeholder="Friend's username" setter={setUsername} id="newUsername" />
			<PopupButtons>
				<MossButton label="Back" onClick={ () => setPopuptype(PopupType.none) } />
				<MossButton label="Ok" onClick={ usernameCheck } />
			</PopupButtons>
		</>
	)
}
