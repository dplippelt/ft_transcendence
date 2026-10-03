import React, {
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Navigate,
	useLocation,
	useNavigate,
	useParams,
} from "react-router-dom";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import {
	PopupType,
	AvatarSize,
	RoutePath,
	MobilePosition,
	JoinStatus,
	getLobbyDraftKey,
} from "../../utils/utils";
import { BottomButtons, } from "../../components/ButtonContainers";
import { BottomButton, } from "../../components/Buttons";
import styles from "./Lobby.module.scss";
import Avatar from "../../components/Avatar";
import noAvatar from "../../assets/no_avatar.png";
import { LobbyChatHistory, } from "../../components/Chat/ChatHistory";
import { LobbyChatBox, } from "../../components/Chat/ChatBox";
import useIsMobile from "../../hooks/useIsMobile";
import InviteFriendPopup from "./LobbyInviteFriendPopup";
import Popup from "../../components/Popup";
import {
	useLobbies,
	type LobbyData,
} from "../../contexts/LobbiesContext";

import { useError, } from "../../contexts/ErrorContext";
import {
	ErrorType,
	mapLobbyApiError,
} from "../../utils/errors";

import { useCurrentUser, } from "../../contexts/AuthContext";

interface IHostButtons
{
	lobbyID: string;

	setPopupType:
		React.Dispatch<React.SetStateAction<PopupType>>;

	isClosingRef:
		React.RefObject<boolean>;
}

interface IGuestButtons
{
	lobbyID: string;
}

interface IPlayer
{
	username: string;
	avatar: string;
	alt: string;
}

interface IPlayers
{
	lobbyID: string;
}

interface ILobbyWindow
{
	lobbyID: string;
}

function Player( { username, avatar, alt }: IPlayer,)
{
	const isMobile = useIsMobile(480);

	const avatarSize = isMobile ? AvatarSize.medium : AvatarSize.large;

	return (
		<div className={styles.player}>
			<Avatar
				src={avatar}
				alt={alt}
				size={avatarSize}
			/>

			<div className={styles.username}>
				{username}
			</div>
		</div>
	);
}

function getHost( lobby: LobbyData,)
{
	return lobby.members.find(member => member.role === "host",);
}

function getSecondPlayer(lobby: LobbyData,)
{
	return lobby.members.find(member => member.role === "guest",);
}

function Players({ lobbyID }: IPlayers,)
{
	const { lobbies } = useLobbies();
	const lobby = lobbies[lobbyID];

	if (!lobby)
		return null;

	const host = getHost(lobby);
	const secondPlayer = getSecondPlayer(lobby);

	function username(member: typeof host, fallback: string,)
	{
		if (!member)
			return fallback;
		return (member.user.username ?? member.user.display_name ?? "Unknown");
	}

	return (
		<div className={styles.players}>
			<Player
				username={ username(host, "Host",) }
				avatar={ host?.user.avatar_url ?? noAvatar }
				alt="Host avatar"
			/>

			<Player
				username={ username(secondPlayer,"Waiting...",) }
				avatar={ secondPlayer ?.user.avatar_url ?? noAvatar }
				alt="Player 2 avatar"
			/>
		</div>
	);
}

function Chat()
{
	return (
		<div className={styles.chat}>
			<LobbyChatHistory/>
			<LobbyChatBox/>
		</div>
	);
}

function LobbyWindow({ lobbyID }: ILobbyWindow,)
{
	return (
		<div className={styles.lobbyWindow}>
			<Players lobbyID={lobbyID} />
			<Chat/>
		</div>
	);
}


function HostButtons({ lobbyID, setPopupType, isClosingRef, }: IHostButtons,)
{
	const navigate = useNavigate();
	const { setError } = useError();
	const { lobbies, closeLobby, } = useLobbies();
	const user = useCurrentUser();
	const numPlayers = lobbies[lobbyID] ?.members.length ?? 0;
    const startDisabled = numPlayers !== 2;
    
	async function onCloseLobby()
	{
		isClosingRef.current = true;

		try
		{
			await closeLobby(lobbyID);

			localStorage.removeItem(
				getLobbyDraftKey(
					String(user.id),
					lobbyID,
				),
			);

			navigate(RoutePath.mainMenu, { replace: true, },);
		}
		catch (error)
		{
			isClosingRef.current = false;

			setError(mapLobbyApiError(error),);
		}
	}


	function onStartGame()
	{
		if (startDisabled)
			return;

		// Game-session bridge comes later.
	}


	return (
		<BottomButtons>
			<BottomButton
				label="Close lobby"
				onClick={onCloseLobby}
				mobilePosition={ MobilePosition.bottom }
			/>

			<BottomButton
				label="Invite friend"
				onClick={ () => setPopupType(PopupType.inviteFriend,) }
			/>

			<BottomButton
				label="Start game"
				onClick={onStartGame}
				disabled={startDisabled}
				mobilePosition={ MobilePosition.top }
			/>
		</BottomButtons>
	);
}

function GuestButtons({ lobbyID }: IGuestButtons,)
{
	const navigate = useNavigate();
	const user = useCurrentUser();
	const { setError } = useError();
	const { leaveLobby } = useLobbies();

	async function onLeaveLobby()
	{
		try
		{
			await leaveLobby(lobbyID);

			localStorage.removeItem(
				getLobbyDraftKey(
					String(user.id),
					lobbyID,
				),
			);

			navigate(RoutePath.mainMenu,);
		}
		catch (error)
		{
			setError(mapLobbyApiError(error),);
		}
	}

	return (
		<BottomButtons>
			<BottomButton
				label="Leave lobby"
				onClick={onLeaveLobby}
				mobilePosition={ MobilePosition.bottom }
			/>
		</BottomButtons>
	);
}

export default function Lobby()
{
	const { setError } = useError();
	const { lobbies, loadLobby, joinLobby, } = useLobbies();
	const { lobbyID } = useParams();
	const user = useCurrentUser();
	const location = useLocation();
	const lobby = lobbyID ? lobbies[lobbyID] : undefined
	const host = lobby ? getHost(lobby) : undefined;
	const isHost = host?.user.id === user.id;
	const isClosingRef = useRef(false);
	const [joinStatus, setJoinStatus,] = useState<JoinStatus>(JoinStatus.pending,);
	const [popupType,setPopupType,] = useState<PopupType>(PopupType.none,);

	useEffect(() =>
	{
		if (!lobbyID)
		{
			setError(ErrorType.lobbyDoesNotExist,);
			setJoinStatus(JoinStatus.failed,);
			return;
		}
		let cancelled = false;

		async function enterLobby()
		{
			try
			{
                const loadedLobby = await loadLobby( lobbyID!, );

				const alreadyMember = loadedLobby.members.some( member => member.user.id === user.id,);

				if (!alreadyMember)
                    await joinLobby(lobbyID!);

				if (!cancelled)
				{
					setJoinStatus(JoinStatus.ok,);
				}
			}
			catch (error)
			{
				if (cancelled)
					return;
				setError(mapLobbyApiError(error),);
				setJoinStatus(JoinStatus.failed,);
			}
		}

		void enterLobby();

		return () =>
		{
			cancelled = true;
		};
	}, [lobbyID, user.id, loadLobby, joinLobby, setError,]);


	if (isClosingRef.current)
		return <Background/>;

	if (joinStatus === JoinStatus.pending)
	{
		return <Background/>;
	}

	if (joinStatus === JoinStatus.failed || !lobby)
	{
		const path = location.state?.from ?? RoutePath.mainMenu;

		return (
			<Navigate
				to={path}
				replace
			/>
		);
	}


	return (
		<>
			<Background/>

			<Page>
				<MenuTitle title="Lobby" />

				<LobbyWindow lobbyID={lobbyID!} />

				{
					isHost &&
						<HostButtons
							lobbyID={ lobbyID! }
							setPopupType={ setPopupType }
							isClosingRef={ isClosingRef }
						/>
				}

				{
					!isHost && <GuestButtons lobbyID={ lobbyID! } />
				}

				<SideBar/>

				{
					popupType === PopupType.inviteFriend &&
						<Popup>
							<InviteFriendPopup
								setPopupType={ setPopupType }
							/>
						</Popup>
				}
			</Page>
		</>
	);
}
