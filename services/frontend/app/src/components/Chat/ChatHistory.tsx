import { useLayoutEffect, useRef } from "react";
import styles from "./ChatHistory.module.scss";
import { useChatHistory } from "../../contexts/ChatHistoryContext";
import { useFriends } from "../../contexts/FriendsContext";

interface IChatMessage
{
	username: string;
	message: string;
}

function ChatMessage( { username, message } : IChatMessage )
{
	return (
		<div className={styles.chatMsg}>
			<div className={styles.nameRow}>
				<div className={styles.username}>{username}</div>
				<div className={styles.username}>:</div>
			</div>
			<div className={styles.message}>{message}</div>
		</div>
	);
}

export default function ChatHistory()
{
	const { activeFriendID } = useFriends();
	const scrollRef = useRef<HTMLDivElement>(null);
	const { chatHistory, setChatToRead } = useChatHistory();
	const activeChatHistory = activeFriendID ? chatHistory[activeFriendID] : undefined;

	useLayoutEffect(() =>
	{
		if (scrollRef.current)
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [activeChatHistory, activeFriendID]);

	useLayoutEffect(() =>
	{
		if ( activeFriendID )
			setChatToRead(activeFriendID);
	}, [activeFriendID]);

	if ( !activeChatHistory )
		return null; // or a loading message;

	return (
		<div className={styles.chatHistory} ref={scrollRef}>
			{ activeChatHistory.map((chatMsg, idx) =>
				<ChatMessage key={idx} username={chatMsg.username} message={chatMsg.message} />
			)}
		</div>
	);
}
