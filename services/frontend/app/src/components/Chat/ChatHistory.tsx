import { useLayoutEffect, useRef } from "react";
import styles from "./ChatHistory.module.scss";
import { useChatHistory } from "../../contexts/ChatHistoryContext";
import { useFriends } from "../../contexts/FriendsContext";
import { useLobbies } from "../../contexts/LobbiesContext";
import { useCurrentUser } from "../../contexts/AuthContext";
import { useParams } from "react-router-dom";

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
	const { activeFriendID, friends } = useFriends();
	const user = useCurrentUser();
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

	// Messages only carry the sender's id (see ChatHistoryContext), so the
	// display name is resolved here from data this component already has,
	// which also means a friend's renamed username shows up immediately
	// instead of being stuck on whatever name was current when they sent it.
	function resolveUsername( senderId: number ): string
	{
		if ( senderId === user.id )
			return user.username ?? user.display_name ?? "You";

		return friends[String(senderId)]?.username ?? "Unknown";
	}

	return (
		<div className={styles.chatHistory} ref={scrollRef}>
			{ activeChatHistory.map((chatMsg) =>
				<ChatMessage key={chatMsg.id} username={resolveUsername(chatMsg.senderId)} message={chatMsg.content} />
			)}
		</div>
	);
}

export function LobbyChatHistory()
{
	const { lobbyID } = useParams();
	const scrollRef = useRef<HTMLDivElement>(null);
	const { getChatHistory } = useLobbies();
	const chatHistory = getChatHistory(lobbyID!);

	useLayoutEffect(() =>
	{
		if (scrollRef.current)
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [chatHistory]);

	return (
		<div className={styles.chatHistory} ref={scrollRef}>
			{ chatHistory?.map((chatMsg, idx) =>
				<ChatMessage key={idx} username={chatMsg.username} message={chatMsg.message} />
			)}
		</div>
	)
}
