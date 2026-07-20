import React from "react";
import styles from "./ChatWindow.module.scss";
import ChatBox from  "../../components/Chat/ChatBox";
import ChatHistory from "../../components/Chat/ChatHistory";
import { ChatTitle } from "../../components/Chat/ChatTitle";
import { PopupType } from "../../components/Chat/enums";
import { useFriends } from "../../contexts/FriendsContext";

interface IChatWindow
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function ChatWindow( { setPopupType } : IChatWindow )
{
	const { friends, activeFriendID } = useFriends();
	const activeFriend = activeFriendID ? friends[activeFriendID] : undefined;

	return (
		<div className={styles.chatWindow}>
			<ChatTitle activeFriend={activeFriend} setPopupType={setPopupType} />
			{ activeFriend && <ChatHistory /> }
			{ activeFriend && <ChatBox /> }
		</div>
	)
}
