import React from "react";
import styles from "./ChatWindow.module.scss";
import ChatBox from  "../../components/Chat/ChatBox";
import ChatHistory from "../../components/Chat/ChatHistory";
import { ChatTitle } from "../../components/Chat/ChatTitle";
import { PopupType } from "../../components/Chat/enums";
import { useFriends } from "../../contexts/FriendsContext";

interface IChatWindow
{
	activeFriendID: string | undefined;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
	setSelectedFriendID: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export default function ChatWindow( { activeFriendID, setPopuptype, setSelectedFriendID } : IChatWindow )
{
	const { friends } = useFriends();
	const activeFriend = activeFriendID ? friends[activeFriendID] : undefined;

	return (
		<div className={styles.chatWindow}>
			<ChatTitle
				activeFriend={activeFriend}
				activeFriendID={activeFriendID}
				setPopuptype={setPopuptype}
				setSelectedFriendID={setSelectedFriendID} />
			{ activeFriend && <ChatHistory activeFriendID={activeFriendID!} /> }
			{ activeFriend && <ChatBox activeFriendID={activeFriendID!} /> }
		</div>
	)
}
