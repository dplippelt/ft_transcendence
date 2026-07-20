import { useEffect, useState } from "react";
import { SendButton } from "../Buttons";
import { ChatInput } from "../TextInput";
import styles from "./ChatBox.module.scss";
import { useChatHistory } from "../../contexts/ChatHistoryContext";
import { useUser } from "../../contexts/UserContext";
import { useFriends } from "../../contexts/FriendsContext";
import { useLobbies } from "../../contexts/LobbiesContext";

export const DRAFT_STORAGE_PREFIX = "draft:";
export const LOBBY_DRAFT = "lobby";

export default function ChatBox()
{
	const { addChatHistory } = useChatHistory();
	const { user } = useUser();
	const { activeFriendID } = useFriends();
	const [msg, setMsg] = useState<string>("");

	useEffect(() =>
	{
		if ( activeFriendID === undefined )
			return;

		const draft = localStorage.getItem(DRAFT_STORAGE_PREFIX + activeFriendID) ?? "";
		setMsg(draft);
	}, [activeFriendID])

	useEffect(() =>
	{
		if ( activeFriendID === undefined )
			return;

		const timeOutID = setTimeout(() => localStorage.setItem(DRAFT_STORAGE_PREFIX + activeFriendID, msg), 400);
		return () => clearTimeout(timeOutID);
	}, [msg, activeFriendID])

	function handleSend()
	{
		if ( msg.trim().length > 0 )
		{
			addChatHistory(activeFriendID!, user.username, msg);
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

export function LobbyChatBox()
{
	const { addChatHistory } = useLobbies();
	const { user } = useUser();
	const [msg, setMsg] = useState<string>("");

	useEffect(() =>
	{
		const draft = localStorage.getItem(DRAFT_STORAGE_PREFIX + LOBBY_DRAFT) ?? "";
		setMsg(draft);
	}, [])

	useEffect(() =>
	{
		const timeOutID = setTimeout(() => localStorage.setItem(DRAFT_STORAGE_PREFIX + LOBBY_DRAFT, msg), 400);
		return () => clearTimeout(timeOutID);
	}, [msg])

	function handleSend()
	{
		if ( msg.trim().length > 0 )
		{
			addChatHistory(user.userID, user.username, msg);
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
