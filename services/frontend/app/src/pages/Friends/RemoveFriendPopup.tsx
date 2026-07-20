import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { PopupType } from "../../utils/utils";
import React, { useEffect } from "react";
import styles from "./FriendPopup.module.scss";
import { useFriends, type IFriendData } from "../../contexts/FriendsContext";

interface IRemoveFriendPopup
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function RemoveFriendPopup( { setPopupType } : IRemoveFriendPopup )
{
	const { friends, selectedFriendID, setSelectedFriendID, removeFriend } = useFriends();
	const friend = getSelectedFriend();

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

	// TODO: for backend integration:
	// The popup should remain open while the request is pending and show an error if it fails. We can use async to achieve this.
	// The button should also be disable while submitting so double-clicking doesn't send two requests.
	function handleRemoveFriend()
	{
		removeFriend(selectedFriendID!);
		closePopup();
	}

	if ( !friend )
		return null;

	return (
			<>
				<label className={styles.query}>{`Are you sure you want to remove ${friend.username} from your friends list?`}</label>
				<PopupButtons>
					<MossButton label="Remove" onClick={handleRemoveFriend} />
					<MossButton label="Cancel" onClick={closePopup} />
				</PopupButtons>
			</>
		)
}
