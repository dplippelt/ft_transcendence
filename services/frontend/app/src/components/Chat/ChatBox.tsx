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
import { ErrorType, mapChatApiError, mapLobbyApiError } from "../../utils/errors";
import { CHAT_MESSAGE_MAX_LENGTH } from "../../api/chatApi";
import { LOBBY_MESSAGE_MAX_LENGTH } from "../../api/lobbyApi";
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

				// Only restore the failed content if the input is still empty.
				// The existing debounced draft effect persists the restored text.
				setMsg(current => current.length > 0 ? current : content);
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
	const { sendLobbyChatMessage } = useLobbies();
	const user = useCurrentUser();

	const [msg, setMsg] = useState<string>("");
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const timeoutIDRef = useRef<number | undefined>(undefined);
	const currentLobbyIDRef = useLatestRef(lobbyID);

	const userID = String(user.id);

	useEffect(() =>
	{
		if (lobbyID === undefined)
			return;

		const draft =
			localStorage.getItem(
				getLobbyDraftKey(userID, lobbyID),
			) ?? "";

		setMsg(draft);
		setError(ErrorType.none);
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

		const content = msg;
		const sentLobbyID = lobbyID!;

		clearTimeout(timeoutIDRef.current);
		localStorage.removeItem(getLobbyDraftKey(userID, sentLobbyID));
		setMsg("");
		setError(ErrorType.none);

		sendLobbyChatMessage(sentLobbyID, content).catch(err =>
		{
			if (currentLobbyIDRef.current === sentLobbyID)
			{
				const chatError = mapChatApiError(err);
				setError(chatError !== ErrorType.unknown ? chatError : mapLobbyApiError(err));
			}

			// Preserve a failed send as a draft, but never overwrite text
			// that was typed after the request started.
			if (currentLobbyIDRef.current !== sentLobbyID)
			{
				localStorage.setItem(getLobbyDraftKey(userID, sentLobbyID), content);
				return;
			}

			// The existing debounced draft effect persists the restored text.
			// Keep state updaters pure; don't write to localStorage inside one.
			setMsg(current => current.length > 0 ? current : content);
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
				maxLength={LOBBY_MESSAGE_MAX_LENGTH}
			/>

			<SendButton onClick={handleSend}/>
		</div>
	);
}
