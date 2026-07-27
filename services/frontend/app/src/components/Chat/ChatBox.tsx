import { useEffect, useState } from "react";
import { SendButton } from "../Buttons";
import { ChatInput } from "../TextInput";
import styles from "./ChatBox.module.scss";
import { useChatHistory } from "../../contexts/ChatHistoryContext";
import { useUser } from "../../contexts/UserContext";
import { useFriends } from "../../contexts/FriendsContext";
import { useLobbies } from "../../contexts/LobbiesContext";
import { useParams } from "react-router-dom";
import { getFriendDraftKey, getLobbyDraftKey } from "../../utils/utils";

export default function ChatBox()
{
	const { addChatHistory } = useChatHistory();
	const { user } = useUser();
	const { activeFriendID } = useFriends();
	const [msg, setMsg] = useState<string>("");

	if ( !activeFriendID )
		return null;

	useEffect(() =>
	{
		if ( activeFriendID === undefined )
			return;

		const draft = localStorage.getItem(getFriendDraftKey(user.userID, activeFriendID)) ?? "";
		setMsg(draft);
	}, [activeFriendID])

	useEffect(() =>
	{
		if ( activeFriendID === undefined )
			return;

		const timeOutID = setTimeout(() => localStorage.setItem(getFriendDraftKey(user.userID, activeFriendID), msg), 400);
		return () => clearTimeout(timeOutID);
	}, [msg, activeFriendID])

	function handleSend()
	{
		if ( msg.trim().length > 0 )
		{
			addChatHistory(activeFriendID!, user.username, msg);
			localStorage.setItem(getFriendDraftKey(user.userID, activeFriendID!), msg);
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
	const { lobbyID } = useParams();
	const { addChatHistory } = useLobbies();
	const { user } = useUser();
	const [msg, setMsg] = useState<string>("");

	if ( !lobbyID )
		return null;

	useEffect(() =>
	{
		const draft = localStorage.getItem(getLobbyDraftKey(user.userID, lobbyID)) ?? "";
		setMsg(draft);
	}, [user.userID, lobbyID])

	useEffect(() =>
	{
		const timeOutID = setTimeout(() => localStorage.setItem(getLobbyDraftKey(user.userID, lobbyID), msg), 400);
		return () => clearTimeout(timeOutID);
	}, [msg, user.userID, lobbyID])

	function handleSend()
	{
		if ( msg.trim().length > 0 )
		{
			addChatHistory(lobbyID!, user.username, msg);
			localStorage.setItem(getLobbyDraftKey(user.userID, lobbyID!), msg)
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
