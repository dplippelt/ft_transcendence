import { ChatInput } from "../../components/TextInput";
import styles from "./ChatWindow.module.scss";
import { useUser, type IChatMsg } from "../../contexts/UserContext";
import { useLayoutEffect, useRef, useState } from "react";
import { SendButton } from "../../components/Buttons";
import Avatar, { AvatarSize } from "../../components/Avatar";

interface IChatWindow
{
	friendChat: string | undefined;
}

interface IChatMessage
{
	username: string;
	message: string;
}

interface IChat
{
	friendChat: string;
}

function ChatTitle( { friendChat } : IChatWindow )
{
	const { user } = useUser();

	function chatTitle() : string
	{
		if (friendChat)
			return `${friendChat}'s Chat`;
		return "No chat selected";
	}

	return(
		<div className={styles.chatTitle}>
			{ friendChat && <Avatar src={user.friends[friendChat].avatar} alt={`${friendChat}'s avatar`}  size={AvatarSize.small} /> }
			<div className={styles.chatTitleText}>{chatTitle()}</div>
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

function ChatHistory( { friendChat } : IChat )
{
	const scrollRef = useRef<HTMLDivElement>(null);
	const { user } = useUser();
	const chatHistory: IChatMsg[] = user.friends[friendChat].chatHistory;

	useLayoutEffect(() =>
	{
		if (scrollRef.current)
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [chatHistory]);

	return (
		<div className={styles.chatHistory} ref={scrollRef}>
			{ chatHistory.map((chatMsg, idx) =>
				<ChatMessage key={idx} username={chatMsg.username} message={chatMsg.message} />
			)}
		</div>
	);
}

function ChatBox( { friendChat } : IChat )
{
	const { user, ...userFunc } = useUser();
	const [msg, setMsg] = useState<string>("");

	function handleSend( message: string )
	{
		if ( msg.trim().length > 0 )
		{
			userFunc.addChatHistory(friendChat, message);
			setMsg("");
		}
	}

	function handleClick()
	{
		handleSend(msg);
	}

	return (
		<div className={styles.chatBox}>
			<ChatInput placeholder="Type here..." onSend={handleSend} msg={msg} setMsg={setMsg} />
			<SendButton onClick={handleClick} />
		</div>
	);
}

export default function ChatWindow( { friendChat } : IChatWindow )
{
	return (
		<div className={styles.chatWindow}>
			<ChatTitle friendChat={friendChat} />
			{ friendChat && <ChatHistory friendChat={friendChat} /> }
			{ friendChat && <ChatBox friendChat={friendChat} /> }
		</div>
	)
}
