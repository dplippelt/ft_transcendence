import React, { useState } from "react";
import ErrorText from "../../components/ErrorText";
import { ErrorType, isErrorType, mapFriendsApiError } from "../../utils/errors";
import { TextInput } from "../../components/TextInput";
import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { PopupType } from "../../utils/utils";
import { getValidUsername } from "../../utils/usernameCheck";
import { useFriends } from "../../contexts/FriendsContext";

interface IAddFriendPopup
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function AddFriendPopup( { setPopupType } : IAddFriendPopup )
{
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const [username, setUsername] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const { addFriend } = useFriends();

	async function usernameCheck()
	{
		if ( isSubmitting )
			return;

		const result: string | ErrorType = getValidUsername(username);
		if ( isErrorType(result) )
			return setError(result);

		const validUsername = result;

		setError(ErrorType.none);
		setIsSubmitting(true);

		try
		{
			await addFriend(validUsername);
			setPopupType(PopupType.none);
		}
		catch (err)
		{
			setError(mapFriendsApiError(err));
		}
		finally
		{
			setIsSubmitting(false);
		}
	}

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error}/> }
			<TextInput label="Add new friend:" placeholder="Friend's username" setter={setUsername} id="newUsername" />
			<PopupButtons>
				<MossButton label={isSubmitting ? "Adding..." : "Add"} onClick={ usernameCheck } />
				<MossButton label="Cancel" onClick={ () => setPopupType(PopupType.none) } />
			</PopupButtons>
		</>
	)
}
