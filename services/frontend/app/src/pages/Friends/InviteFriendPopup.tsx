import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { PopupType } from "./enums";
import React from "react";
import styles from "./FriendPopup.module.scss";

interface IInvitePopup
{
	username: string;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
}

// This is just a placeholder popup component for now.
export default function InviteFriendPopup( { username, setPopuptype } : IInvitePopup )
{
	function handleInvite()
	{
		// implement later
		setPopuptype(PopupType.none);
	}

	return (
			<>
				<label className={styles.query}>{`Invite ${username} to a co-op game?`}</label>
				<PopupButtons>
					<MossButton label="Ok" onClick={handleInvite} />
					<MossButton label="Cancel" onClick={ () => setPopuptype(PopupType.none) } />
				</PopupButtons>
			</>
		)
}
