import React from "react";
import styles from "./ChatWindow.module.scss";
import ChatBox from  "../../components/Chat/ChatBox";
import ChatHistory from "../../components/Chat/ChatHistory";
import { ChatTitle } from "../../components/Chat/ChatTitle";
import { PopupType } from "../../components/Chat/enums";
import { useUser } from "../../contexts/UserContext";

interface IChatWindow
{
	activeChat: string | undefined;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
	setSelectedFriend: React.Dispatch<React.SetStateAction<string>>;
}

export default function ChatWindow( { activeChat, setPopuptype, setSelectedFriend } : IChatWindow )
{
	const { user } = useUser();
	const activeFriend = activeChat ? user.friends[activeChat] : undefined;

	return (
		<div className={styles.chatWindow}>
			<ChatTitle activeFriend={activeFriend} setPopuptype={setPopuptype} setSelectedFriend={setSelectedFriend} />
			{ activeFriend && <ChatHistory activeFriend={activeFriend} /> }
			{ activeFriend && <ChatBox activeFriend={activeFriend} /> }
		</div>
	)
}
