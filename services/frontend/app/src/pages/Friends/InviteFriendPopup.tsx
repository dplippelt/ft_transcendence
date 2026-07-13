import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { PopupType } from "../../components/Chat/enums";
import React from "react";
import styles from "./FriendPopup.module.scss";
import { useFriends } from "../../contexts/FriendsContext";

interface IInvitePopup
{
	selectedFriendID: string;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
}

// This is just a placeholder popup component for now.
export default function InviteFriendPopup( { selectedFriendID, setPopuptype } : IInvitePopup )
{
	const { friends } = useFriends();
	const friendName = friends[selectedFriendID].username;

	function handleInvite()
	{
		// implement later
		setPopuptype(PopupType.none);
	}

	return (
			<>
				<label className={styles.query}>{`Invite ${friendName} to a co-op game?`}</label>
				<PopupButtons>
					<MossButton label="Invite" onClick={handleInvite} />
					<MossButton label="Cancel" onClick={ () => setPopuptype(PopupType.none) } />
				</PopupButtons>
			</>
		)
}
