import { useLayoutEffect, useRef } from "react";
import type { IFriendData } from "../../contexts/UserContext";
import styles from "./ChatHistory.module.scss";

interface IChatMessage
{
	username: string;
	message: string;
}

interface IChatHistory
{
	activeFriend: IFriendData;
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

export default function ChatHistory( { activeFriend } : IChatHistory )
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
