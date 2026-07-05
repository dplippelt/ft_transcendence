import { ChatInput } from "../../components/TextInput";
import styles from "./ChatWindow.module.scss";
import { useUser, type IChatMsg } from "../../contexts/UserContext";
import { useLayoutEffect, useRef, useState } from "react";
import { SendButton } from "../../components/Buttons";
import Avatar, { AvatarSize } from "../../components/Avatar";

interface IChatWindow
{
	activeChat: string | undefined;
}

interface IChatMessage
{
	username: string;
	message: string;
}

interface IChat
{
	activeChat: string;
}

function ChatTitle( { activeChat } : IChatWindow )
{
	const { user } = useUser();

	function chatTitle() : string
	{
		if (activeChat)
			return `${activeChat}'s Chat`;
		return "No chat selected";
	}

	return(
		<div className={styles.chatTitle}>
			{ activeChat && <Avatar src={user.friends[activeChat].avatar} alt={`${activeChat}'s avatar`}  size={AvatarSize.small} /> }
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

function ChatHistory( { activeChat } : IChat )
{
	const scrollRef = useRef<HTMLDivElement>(null);
	const { user } = useUser();
	const chatHistory: IChatMsg[] = user.friends[activeChat].chatHistory;

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

function ChatBox( { activeChat } : IChat )
{
	const { user, ...userFunc } = useUser();
	const [msg, setMsg] = useState<string>("");

	function handleSend()
	{
		if ( msg.trim().length > 0 )
		{
			userFunc.addChatHistory(activeChat, msg);
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

export default function ChatWindow( { activeChat } : IChatWindow )
{
	return (
		<div className={styles.chatWindow}>
			<ChatTitle activeChat={activeChat} />
			{ activeChat && <ChatHistory activeChat={activeChat} /> }
			{ activeChat && <ChatBox activeChat={activeChat} /> }
		</div>
	)
}
