import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { SendButton } from "../Buttons";
import { ChatInput } from "../TextInput";
import styles from "./ChatBox.module.scss";

import { useChatHistory } from "../../contexts/ChatHistoryContext";
import { useFriends } from "../../contexts/FriendsContext";
import { useLobbies } from "../../contexts/LobbiesContext";
import { useCurrentUser } from "../../contexts/AuthContext";

import { getFriendDraftKey, getLobbyDraftKey, } from "../../utils/utils";


export default function ChatBox()
{
	const { addChatHistory } = useChatHistory();
	const { activeFriendID } = useFriends();
	const user = useCurrentUser();

	const [msg, setMsg] = useState<string>("");
	const timeoutIDRef = useRef<number | undefined>(undefined);

	const userID = String(user.id);
	const username =
		user.username ??
		user.display_name ??
		"Unknown";

	useEffect(() =>
	{
		if (activeFriendID === undefined)
			return;

		const draft =
			localStorage.getItem(
				getFriendDraftKey(userID, activeFriendID),
			) ?? "";

		setMsg(draft);
	}, [userID, activeFriendID]);

	useEffect(() =>
	{
		if (activeFriendID === undefined)
			return;

		const friendID = activeFriendID;

		function persistDraft()
		{
			if (msg.trim().length === 0)
			{
				localStorage.removeItem(
					getFriendDraftKey(userID, friendID),
				);
				return;
			}

			localStorage.setItem(
				getFriendDraftKey(userID, friendID),
				msg,
			);
		}

		timeoutIDRef.current =
			window.setTimeout(persistDraft, 400);

		return () =>
		{
			clearTimeout(timeoutIDRef.current);
		};
	}, [msg, userID, activeFriendID]);

	if (!activeFriendID)
		return null;

	function handleSend()
	{
		if (msg.trim().length === 0)
			return;

		addChatHistory(
			activeFriendID!,
			username,
			msg,
		);

		clearTimeout(timeoutIDRef.current);

		localStorage.removeItem(
			getFriendDraftKey(
				userID,
				activeFriendID!,
			),
		);

		setMsg("");
	}

	return (
		<div className={styles.chatBox}>
			<ChatInput
				placeholder="Type here..."
				onSend={handleSend}
				msg={msg}
				setMsg={setMsg}
			/>

			<SendButton onClick={handleSend}/>
		</div>
	);
}


export function LobbyChatBox()
{
	const { lobbyID } = useParams();
	const { addChatHistory } = useLobbies();
	const user = useCurrentUser();

	const [msg, setMsg] = useState<string>("");
	const timeoutIDRef = useRef<number | undefined>(undefined);

	const userID = String(user.id);
	const username =
		user.username ??
		user.display_name ??
		"Unknown";

	useEffect(() =>
	{
		if (lobbyID === undefined)
			return;

		const draft =
			localStorage.getItem(
				getLobbyDraftKey(userID, lobbyID),
			) ?? "";

		setMsg(draft);
	}, [userID, lobbyID]);

	useEffect(() =>
	{
		if (lobbyID === undefined)
			return;

		const currentLobbyID = lobbyID;

		function persistDraft()
		{
			if (msg.trim().length === 0)
			{
				localStorage.removeItem(
					getLobbyDraftKey(
						userID,
						currentLobbyID,
					),
				);
				return;
			}

			localStorage.setItem(
				getLobbyDraftKey(
					userID,
					currentLobbyID,
				),
				msg,
			);
		}

		timeoutIDRef.current =
			window.setTimeout(persistDraft, 400);

		return () =>
		{
			clearTimeout(timeoutIDRef.current);
		};
	}, [msg, userID, lobbyID]);

	if (!lobbyID)
		return null;

	function handleSend()
	{
		if (msg.trim().length === 0)
			return;

		addChatHistory(
			lobbyID!,
			username,
			msg,
		);

		clearTimeout(timeoutIDRef.current);

		localStorage.removeItem(
			getLobbyDraftKey(
				userID,
				lobbyID!,
			),
		);

		setMsg("");
	}

	return (
		<div className={styles.chatBox}>
			<ChatInput
				placeholder="Type here..."
				onSend={handleSend}
				msg={msg}
				setMsg={setMsg}
			/>

			<SendButton onClick={handleSend}/>
		</div>
	);
}
