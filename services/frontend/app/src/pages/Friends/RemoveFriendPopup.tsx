import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { getFriendDraftKey, PopupType } from "../../utils/utils";
import React, { useEffect, useState } from "react";
import styles from "./FriendPopup.module.scss";
import { useFriends, type IFriendData } from "../../contexts/FriendsContext";
import { useCurrentUser } from "../../contexts/AuthContext";
import ErrorText from "../../components/ErrorText";
import { ErrorType, mapFriendsApiError } from "../../utils/errors";

interface IRemoveFriendPopup
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function RemoveFriendPopup( { setPopupType } : IRemoveFriendPopup )
{
	const { friends, selectedFriendID, setSelectedFriendID, removeFriend } = useFriends();
	const friend = getSelectedFriend();
	const user = useCurrentUser();
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	useEffect(() =>
	{
		if ( !friend )
			closePopup();
	}, [friend]);

	function closePopup()
	{
		setSelectedFriendID(undefined);
		setPopupType(PopupType.none);
	}

	function getSelectedFriend() : IFriendData | undefined
	{
		if ( !selectedFriendID )
			return undefined;
		return friends[selectedFriendID];
	}

	async function handleRemoveFriend()
	{
		if ( isSubmitting )
			return;

		setError(ErrorType.none);
		setIsSubmitting(true);

		try
		{
			await removeFriend(selectedFriendID!);
			localStorage.removeItem(getFriendDraftKey(String(user.id), selectedFriendID!));
			closePopup();
		}
		catch (err)
		{
			setError(mapFriendsApiError(err));
			setIsSubmitting(false);
		}
	}

	if ( !friend )
		return null;

	return (
			<>
				{ error !== ErrorType.none && <ErrorText error={error}/> }
				<label className={styles.query}>{`Are you sure you want to remove ${friend.username} from your friends list?`}</label>
				<PopupButtons>
					<MossButton label={isSubmitting ? "Removing..." : "Remove"} onClick={handleRemoveFriend} />
					<MossButton label="Cancel" onClick={closePopup} />
				</PopupButtons>
			</>
		)
}
