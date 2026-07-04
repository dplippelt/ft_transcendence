import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import ErrorText from "../../components/ErrorText";
import { ErrorType } from "../../utils/utils";
import { TextInput } from "../../components/TextInput";
import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";

interface IAddFriendPopup
{
	setPopupVis: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AddFriendPopup( { setPopupVis } : IAddFriendPopup )
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
		setPopupVis(false);
	}

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error}/> }
			<TextInput label="Add new friend:" placeholder="Friend's username" setter={setUsername} id="newUsername" />
			<PopupButtons>
				<MossButton label="Back" onClick={ () => setPopupVis(false) } />
				<MossButton label="Ok" onClick={ usernameCheck } />
			</PopupButtons>
		</>
	)
}
