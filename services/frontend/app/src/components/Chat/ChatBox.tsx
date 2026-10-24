import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { SendButton } from "../Buttons";
import { ChatInput } from "../TextInput";
import ErrorText from "../ErrorText";
import styles from "./ChatBox.module.scss";

import { useChatHistory } from "../../contexts/ChatHistoryContext";
import { useFriends } from "../../contexts/FriendsContext";
import { useLobbies } from "../../contexts/LobbiesContext";
import { useCurrentUser } from "../../contexts/AuthContext";

import { getFriendDraftKey, getLobbyDraftKey, } from "../../utils/utils";
import { ErrorType, mapChatApiError } from "../../utils/errors";
import { CHAT_MESSAGE_MAX_LENGTH } from "../../api/chatApi";
import useLatestRef from "../../hooks/useLatestRef";


export default function ChatBox()
{
	const { addChatHistory } = useChatHistory();
	const { activeFriendID } = useFriends();
	const user = useCurrentUser();

	const [msg, setMsg] = useState<string>("");
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const timeoutIDRef = useRef<number | undefined>(undefined);

	// Lets handleSend's failure handler (below) check, once a send actually
	// fails, whether the user is still on the same friend's chat -- read
	// from a ref rather than the activeFriendID in this render's closure,
	// since that closure is stale by the time an async rejection arrives.
	const activeFriendIDRef = useLatestRef(activeFriendID);

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
		setError(ErrorType.none);
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
		setError(ErrorType.none);

		addChatHistory(activeFriendID!, content)
			.catch((err) =>
			{
				// Only surface an error for this send if the user is still
				// looking at the chat it failed on -- otherwise it'd show
				// up attached to whatever friend they've since switched to.
				if (activeFriendIDRef.current === sentFriendID)
					setError(mapChatApiError(err));

				// If the user has switched to a different friend's chat by
				// now, there's no live autosave running for this one to
				// race with, so it's always safe to persist the failed
				// content as its draft.
				if (activeFriendIDRef.current !== sentFriendID)
				{
					localStorage.setItem(
						getFriendDraftKey(userID, sentFriendID),
						content,
					);
					return;
				}

				// Still on the same chat: only restore the failed content
				// (to both the visible input and the draft) if the box is
				// still empty. If the user already typed something new,
				// leave both alone -- writing the old failed content to
				// localStorage here would clobber the newer draft the
				// existing debounced autosave effect is about to persist.
				setMsg(currentMsg =>
				{
					if (currentMsg.length > 0)
						return currentMsg;

					localStorage.setItem(
						getFriendDraftKey(userID, sentFriendID),
						content,
					);
					return content;
				});
			});
	}

	return (
		<div className={styles.chatBox}>
			{ error !== ErrorType.none &&
				<div className={styles.chatError}>
					<ErrorText error={error}/>
				</div>
			}

			<ChatInput
				placeholder="Type here..."
				onSend={handleSend}
				msg={msg}
				setMsg={setMsg}
				maxLength={CHAT_MESSAGE_MAX_LENGTH}
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
