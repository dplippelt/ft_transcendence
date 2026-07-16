import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { PopupType } from "../../components/Chat/enums";
import React, { useEffect } from "react";
import styles from "./FriendPopup.module.scss";
import { useFriends, type IFriendData } from "../../contexts/FriendsContext";

interface IInvitePopup
{
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
}

// This is just a placeholder popup component for now.
export default function InviteFriendPopup( { setPopuptype } : IInvitePopup )
{
	const { friends, selectedFriendID, setSelectedFriendID } = useFriends();
	const friend = getSelectedFriend();

	useEffect(() =>
	{
		if ( !friend )
			closePopup();
	}, [friend]);

	function closePopup()
	{
		setSelectedFriendID(undefined);
		setPopuptype(PopupType.none);
	}

	function getSelectedFriend() : IFriendData | undefined
	{
		if ( !selectedFriendID )
			return undefined;
		return friends[selectedFriendID];
	}

	function handleInvite()
	{
		// implement later
		closePopup();
	}
	
	if ( !friend )
		return null;

	return (
			<>
				<label className={styles.query}>{`Invite ${friend.username} to a co-op game?`}</label>
				<PopupButtons>
					<MossButton label="Invite" onClick={handleInvite} />
					<MossButton label="Cancel" onClick={closePopup} />
				</PopupButtons>
			</>
		)
}
