import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { PopupType } from "../../components/Chat/enums";
import React from "react";
import styles from "./FriendPopup.module.scss";
import { useFriends } from "../../contexts/FriendsContext";

interface IRemoveFriendPopup
{
	selectedFriendID: string;
	activeFriendID: string | undefined;
	setSelectedFriendID: React.Dispatch<React.SetStateAction<string | undefined>>;
	setActiveFriendID: React.Dispatch<React.SetStateAction<string | undefined>>;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function RemoveFriendPopup( { selectedFriendID, activeFriendID, setSelectedFriendID, setActiveFriendID, setPopuptype } : IRemoveFriendPopup )
{
	const { friends, removeFriend } = useFriends();
	const friendName = friends[selectedFriendID].username;

	function handleRemoveFriend()
	{
		removeFriend(selectedFriendID);
		if ( selectedFriendID === activeFriendID )
			setActiveFriendID(undefined);
		setSelectedFriendID(undefined);
		setPopuptype(PopupType.none);
	}

	return (
			<>
				<label className={styles.query}>{`Are you sure you want to remove ${friendName} from your friends list?`}</label>
				<PopupButtons>
					<MossButton label="Remove" onClick={handleRemoveFriend} />
					<MossButton label="Cancel" onClick={ () => setPopuptype(PopupType.none) } />
				</PopupButtons>
			</>
		)
}
