import React from "react";
import styles from "./ChatWindow.module.scss";
import ChatBox from  "../../components/Chat/ChatBox";
import ChatHistory from "../../components/Chat/ChatHistory";
import { ChatTitle } from "../../components/Chat/ChatTitle";
import { PopupType } from "../../components/Chat/enums";
import { useFriends } from "../../contexts/FriendsContext";

interface IChatWindow
{
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
}

export default function ChatWindow( { setPopuptype } : IChatWindow )
{
	const { friends, activeFriendID } = useFriends();
	const activeFriend = activeFriendID ? friends[activeFriendID] : undefined;

	return (
		<div className={styles.chatWindow}>
			<ChatTitle activeFriend={activeFriend} setPopuptype={setPopuptype} />
			{ activeFriend && <ChatHistory /> }
			{ activeFriend && <ChatBox /> }
		</div>
	)
}
