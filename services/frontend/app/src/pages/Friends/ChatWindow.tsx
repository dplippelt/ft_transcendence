import { ChatInput } from "../../components/TextInput";
import styles from "./ChatWindow.module.scss";
import { useUser } from "../../contexts/UserContext";
import { useLayoutEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";

interface IChatTitle
{
	friendChat: string | undefined;
}

export interface IChatMsg
{
	username: string;
	message: string;
}

interface IChatHistory
{
	chatHistory: IChatMsg[];
}

interface IChatBox
{
	addMessage: ( message: IChatMsg ) => void;
}

interface IChatWindow
{
	friendChat: string | undefined;
	chatHistory: () => IChatMsg[];
	addMessage: ( message: IChatMsg ) => void;
}

function ChatTitle( { friendChat } : IChatTitle )
{
	function chatTitle() : string
	{
		if (friendChat)
			return `${friendChat}'s Chat`;
		return "No chat selected";
	}

	return <div className={styles.chatTitle}>{chatTitle()}</div>
}

function ChatMsg( { username, message } : IChatMsg )
{
	return (
		<div className={styles.chatMsg}>
			<div className={styles.username}>{username}:</div>
			<div className={styles.message}>{message}</div>
		</div>
	);
}

function ChatHistory( { chatHistory } : IChatHistory )
{
	const scrollRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() =>
	{
		if (scrollRef.current)
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [chatHistory]);

	return (
		<div className={styles.chatHistory} ref={scrollRef}>
			{ chatHistory.map((chatMsg, idx) =>
				<ChatMsg key={idx} username={chatMsg.username} message={chatMsg.message} />
			)}
		</div>
	);
}

function ChatBox( { addMessage } : IChatBox )
{
	const { user } = useUser();
	const chatInputRef = useRef<HTMLTextAreaElement>(null);

	function handleOnSend( message: string )
	{
		addMessage({username: user.username, message: message })
	}

	function handleOnClick()
	{
		if ( !chatInputRef.current )
			return;
		handleOnSend(chatInputRef.current.value);
	}

	return (
		<div className={styles.chatBox}>
			<ChatInput placeholder="Type here..." onSend={handleOnSend} ref={chatInputRef} />
			<div className={styles.sendButton} onClick={handleOnClick}>
				<SendHorizontal />
			</div>

		</div>
	);
}

export default function ChatWindow( { friendChat, chatHistory, addMessage } : IChatWindow )
{
	return (
		<div className={styles.chatWindow}>
			<ChatTitle friendChat={friendChat} />
			<ChatHistory chatHistory={chatHistory()} />
			<ChatBox addMessage={addMessage} />
		</div>
	)
}
