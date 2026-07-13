import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";
import { PopupType } from "./enums";
import React from "react";
import styles from "./FriendPopup.module.scss";

interface IRemoveFriendPopup
{
	username: string;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function RemoveFriendPopup( { username, setPopuptype } : IRemoveFriendPopup )
{
	const userFunc = useUser();

	function handleRemoveFriend()
	{
		userFunc.removeFriend(username);
		setPopuptype(PopupType.none);
	}

	return (
			<>
				<label className={styles.query}>{`Are you sure you want to remove ${username} from your friends list?`}</label>
				<PopupButtons>
					<MossButton label="Remove" onClick={handleRemoveFriend} />
					<MossButton label="Cancel" onClick={ () => setPopuptype(PopupType.none) } />
				</PopupButtons>
			</>
		)
}
