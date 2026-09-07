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

	// Lets handleSend's failure handler (below) check, once a send actually
	// fails, whether the user is still on the same friend's chat -- read
	// from a ref rather than the activeFriendID in this render's closure,
	// since that closure is stale by the time an async rejection arrives.
	const activeFriendIDRef = useRef(activeFriendID);

	useEffect(() =>
	{
		activeFriendIDRef.current = activeFriendID;
	}, [activeFriendID]);

	const userID = String(user.id);

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

		const content = msg;
		const sentFriendID = activeFriendID!;

		clearTimeout(timeoutIDRef.current);

		localStorage.removeItem(
			getFriendDraftKey(
				userID,
				activeFriendID!,
			),
		);

		setMsg("");

		addChatHistory(activeFriendID!, content)
			.catch(() =>
			{
				// Always persist the failed content as that friend's draft,
				// even if the user has since switched away, so it isn't
				// silently lost -- only restoring it to the visible input
				// (below) depends on still being on the same chat.
				localStorage.setItem(
					getFriendDraftKey(userID, sentFriendID),
					content,
				);

				// Only touch the visible input if the user is still on the
				// same friend's chat (otherwise this would inject friend
				// A's failed message into friend B's input) and hasn't
				// already typed something new into the box in the meantime
				// (otherwise this would clobber that newer, unsent draft).
				if (activeFriendIDRef.current !== sentFriendID)
					return;

				setMsg(currentMsg => currentMsg.length === 0 ? content : currentMsg);
			});
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
