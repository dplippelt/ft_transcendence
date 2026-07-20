import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import ErrorText from "../../components/ErrorText";
import { ErrorType } from "../../utils/errors";
import { TextInput } from "../../components/TextInput";
import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { PopupType } from "../../utils/utils";
import { getValidUsername, isErrorType } from "../../utils/usernameCheck";
import { useFriends } from "../../contexts/FriendsContext";

interface IAddFriendPopup
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function AddFriendPopup( { setPopupType } : IAddFriendPopup )
{
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const [username, setUsername] = useState<string>("");
	const { user } = useUser();
	const { friends, addFriend } = useFriends();

	function usernameCheck()
	{
		const result: string | ErrorType = getValidUsername(username);
		if ( isErrorType(result) )
			return setError(result);

		const validUsername = result;

		if ( validUsername.toLowerCase() === user.username.toLowerCase() )
			return setError(ErrorType.cannotAddSelf);

		// Mock username checks
		if ( validUsername.toLowerCase().length === 1 )
			return setError(ErrorType.userDoesNotExist);
		if ( Object.values(friends).some(friend => friend.username.toLowerCase() === validUsername.toLowerCase()) )
			return setError(ErrorType.userAlreadyFriend);

		addFriend(validUsername)
		setPopupType(PopupType.none);
	}

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error}/> }
			<TextInput label="Add new friend:" placeholder="Friend's username" setter={setUsername} id="newUsername" />
			<PopupButtons>
				<MossButton label="Add" onClick={ usernameCheck } />
				<MossButton label="Cancel" onClick={ () => setPopupType(PopupType.none) } />
			</PopupButtons>
		</>
	)
}
