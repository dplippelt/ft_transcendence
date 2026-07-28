import { useEffect, useRef, useState } from "react";
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
	const timeoutIDRef = useRef<number | undefined>(undefined);
	const skipWriteRef = useRef<boolean>(false);

	useEffect(() =>
	{
		if ( activeFriendID === undefined )
			return;

		const draft = localStorage.getItem(getFriendDraftKey(user.userID, activeFriendID)) ?? "";
		setMsg(draft);
	}, [user.userID, activeFriendID])

	useEffect(() =>
	{
		if ( activeFriendID === undefined )
			return;
		if ( skipWriteRef.current )
		{
			skipWriteRef.current = false;
			return;
		}

		function persistDraft()
		{
			if ( msg.trim().length === 0 )
				return localStorage.removeItem(getFriendDraftKey(user.userID, activeFriendID!));
			return localStorage.setItem(getFriendDraftKey(user.userID, activeFriendID!), msg);
		}

		timeoutIDRef.current = setTimeout(persistDraft, 400);
		return () => { clearTimeout(timeoutIDRef.current) };
	}, [msg, user.userID, activeFriendID])

	if ( !activeFriendID )
		return null;

	function handleSend()
	{
		if ( msg.trim().length > 0 )
		{
			addChatHistory(activeFriendID!, user.username, msg);
			clearTimeout(timeoutIDRef.current);
			localStorage.removeItem(getFriendDraftKey(user.userID, activeFriendID!));
			skipWriteRef.current = true;
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
	const timeoutIDRef = useRef<number | null>(null);
	const skipWriteRef = useRef<boolean>(false);

	useEffect(() =>
	{
		if ( lobbyID === undefined )
			return;

		const draft = localStorage.getItem(getLobbyDraftKey(user.userID, lobbyID)) ?? "";
		setMsg(draft);
	}, [user.userID, lobbyID])

	useEffect(() =>
	{
		if ( lobbyID === undefined )
			return;
		if ( skipWriteRef.current )
		{
			skipWriteRef.current = false;
			return;
		}

		function persistDraft()
		{
			if ( msg.trim().length === 0 )
				return localStorage.removeItem(getLobbyDraftKey(user.userID, lobbyID!));
			return localStorage.setItem(getLobbyDraftKey(user.userID, lobbyID!), msg);
		}

		timeoutIDRef.current = setTimeout(persistDraft, 400);
		return () => { if ( timeoutIDRef.current ) clearTimeout(timeoutIDRef.current) };
	}, [msg, user.userID, lobbyID])

	if ( !lobbyID )
		return null;

	function handleSend()
	{
		if ( msg.trim().length > 0 )
		{
			addChatHistory(lobbyID!, user.username, msg);
			if ( timeoutIDRef.current )
				clearTimeout(timeoutIDRef.current);
			localStorage.removeItem(getLobbyDraftKey(user.userID, lobbyID!));
			skipWriteRef.current = true;
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
