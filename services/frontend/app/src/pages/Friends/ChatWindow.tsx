import React from "react";
import { ChatInput } from "../../components/TextInput";
import styles from "./ChatWindow.module.scss";
import { useUser, type IChatMsg, type IFriendData } from "../../contexts/UserContext";
import { useLayoutEffect, useRef, useState } from "react";
import { InviteToPlayButton, SendButton } from "../../components/Buttons";
import Avatar, { AvatarSize } from "../../components/Avatar";
import useIsMobile from "../../hooks/useIsMobile";
import { PopupType } from "./enums";

interface IChatWindow
{
	activeChat: string | undefined;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
	setSelectedFriend: React.Dispatch<React.SetStateAction<string>>;
}

interface IChatTitle
{
	activeFriend: IFriendData | undefined;
	setPopuptype: React.Dispatch<React.SetStateAction<PopupType>>;
	setSelectedFriend: React.Dispatch<React.SetStateAction<string>>;
}

interface IChatMessage
{
	username: string;
	message: string;
}

interface IChat
{
	activeFriend: IFriendData;
}

function ChatTitle( { activeFriend, setPopuptype, setSelectedFriend } : IChatTitle )
{
	const isMobile = useIsMobile();

	function chatTitle() : string
	{
		if (activeFriend)
			return `${activeFriend.username}'s Chat`;
		return "No chat selected";
	}

	function handleInviteToPlay( username: string )
	{
		setPopuptype(PopupType.inviteFriend);
		setSelectedFriend(username);
	}

	return(
		<div className={styles.chatTitle}>
			{ activeFriend && <Avatar src={activeFriend.avatar} alt={`${activeFriend.username}'s avatar`}  size={AvatarSize.small} /> }
			<div className={styles.chatTitleText}>{chatTitle()}</div>
			{ isMobile && activeFriend && <InviteToPlayButton onClick={ () => handleInviteToPlay(activeFriend.username) } />}
		</div>
	);
}

function ChatMessage( { username, message } : IChatMessage )
{
	return (
		<div className={styles.chatMsg}>
			<div className={styles.username}>{username}:</div>
			<div className={styles.message}>{message}</div>
		</div>
	);
}

function ChatHistory( { activeFriend } : IChat )
{
	const scrollRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() =>
	{
		if (scrollRef.current)
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [activeFriend.chatHistory]);

	return (
		<div className={styles.chatHistory} ref={scrollRef}>
			{ activeFriend.chatHistory.map((chatMsg, idx) =>
				<ChatMessage key={idx} username={chatMsg.username} message={chatMsg.message} />
			)}
		</div>
	);
}

function ChatBox( { activeFriend } : IChat )
{
	const { addChatHistory } = useUser();
	const [msg, setMsg] = useState<string>("");

	function handleSend()
	{
		if ( msg.trim().length > 0 )
		{
			addChatHistory(activeFriend.username, msg);
			setMsg("");
		}
	}

	return (
		<div className={styles.chatBox}>
			<ChatInput placeholder="Type here..." onSend={handleSend} msg={msg} setMsg={setMsg} />
			<SendButton onClick={handleSend} />
		</div>
	);
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
