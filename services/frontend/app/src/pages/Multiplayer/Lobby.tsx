import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import { PopupType, AvatarSize, RoutePath, MobilePosition, JoinStatus, getLobbyDraftKey } from "../../utils/utils";
import { BottomButtons } from "../../components/ButtonContainers";
import { BottomButton } from "../../components/Buttons";
import styles from "./Lobby.module.scss";
import Avatar from "../../components/Avatar";
import noAvatar from "../../assets/no_avatar.png";
import { LobbyChatHistory } from "../../components/Chat/ChatHistory";
import { LobbyChatBox } from "../../components/Chat/ChatBox";
import useIsMobile from "../../hooks/useIsMobile";
import InviteFriendPopup from "./LobbyInviteFriendPopup";
import Popup from "../../components/Popup";
import { useLobbies } from "../../contexts/LobbiesContext";
import { useError } from "../../contexts/ErrorContext";
import { ErrorType } from "../../utils/errors";
import { useCurrentUser } from "../../contexts/AuthContext";

interface IHostButtons
{
	lobbyID: string;
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
	isClosingRef: React.RefObject<boolean>;
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

function Player( { username, avatar, alt } : IPlayer )
{
	const isMobile = useIsMobile(480);
	const avatarSize = isMobile ? AvatarSize.medium : AvatarSize.large;

	return (
		<div className={styles.player}>
			<Avatar src={avatar} alt={alt} size={avatarSize} />
			<div className={styles.username}>{username}</div>
		</div>
	)
}

function Players( { lobbyID } : IPlayers )
{
	const { lobbies } = useLobbies();
	const user = useCurrentUser();
	const lobby = lobbies[lobbyID];

	function getHostUsername() : string
	{
		if ( lobby.hostID === String(user.id) )
			return user.username ?? user.display_name ?? "Unknown";
		return "Host"; // TODO: fetch username from database
	}

	function getHostAvatar(): string
    {
        if (lobby.hostID === String(user.id))
            return user.avatar_url ?? noAvatar;

        return noAvatar;
    }

	function getGuestUsername() : string
	{
		if ( lobby.guestID === String(user.id) )
			return user.username ?? user.display_name ?? "Unknown";
		if ( lobby.guestID )
			return "Guest"; // TODO: fetch username from database
		return "Waiting...";
	}

	function getGuestAvatar() : string
	{
		if ( lobby.guestID === String(user.id) )
			return user.avatar_url ?? noAvatar;

		return noAvatar;
	}

	return (
		<div className={styles.players}>
			<Player username={getHostUsername()} avatar={getHostAvatar()} alt="Host avatar" />
			<Player username={getGuestUsername()} avatar={getGuestAvatar()} alt="Guest avatar" />
		</div>
	);
}

function Chat()
{
	return (
		<div className={styles.chat}>
			<LobbyChatHistory />
			<LobbyChatBox />
		</div>
	)
}

function LobbyWindow( { lobbyID } : ILobbyWindow )
{
	return (
		<div className={styles.lobbyWindow}>
			<Players lobbyID={lobbyID} />
			<Chat />
		</div>
	);
}

function HostButtons( { lobbyID, setPopupType, isClosingRef } : IHostButtons )
{
	const navigate = useNavigate();
	const { lobbies, closeLobby } = useLobbies();
	const user = useCurrentUser();
	const numPlayers = lobbies[lobbyID]?.guestID ? 2 : 1;

	function onCloseLobby()
	{
		isClosingRef.current = true;
		localStorage.removeItem(getLobbyDraftKey(String(user.id), lobbyID));
		closeLobby(lobbyID);
		navigate(RoutePath.mainMenu, { replace: true }); // intentional back to main menu instead of multiplayer page
	}

	function onStartGame()
	{
		if ( numPlayers !== 2 )
			return;

		// implement later
	}

	function isDisabled() : boolean
	{
		if ( numPlayers !== 2 )
			return true;
		return false;
	}

	return (
		<BottomButtons>
			<BottomButton label="Close lobby" onClick={onCloseLobby} mobilePosition={MobilePosition.bottom} />
			<BottomButton label="Invite friend" onClick={ () => setPopupType(PopupType.inviteFriend) } />
			<BottomButton label="Start game" onClick={onStartGame} disabled={isDisabled()} mobilePosition={MobilePosition.top} />
		</BottomButtons>
	);
}

function GuestButtons( { lobbyID } : IGuestButtons )
{
	const navigate = useNavigate();
	const user = useCurrentUser();
	const { leaveLobby } = useLobbies();

	function onLeaveLobby()
	{
		localStorage.removeItem(getLobbyDraftKey(String(user.id), lobbyID));
		leaveLobby(lobbyID);
		navigate(RoutePath.mainMenu); // intentional back to main menu instead of multiplayer page
	}

	return (
		<BottomButtons>
			<BottomButton label="Leave lobby" onClick={onLeaveLobby} mobilePosition={MobilePosition.bottom} />
		</BottomButtons>
	);
}

export default function Lobby()
{
	const { setError } = useError();
	const { lobbies, joinLobby } = useLobbies();
	const { lobbyID } = useParams();
	const user  = useCurrentUser();
	const location = useLocation();

	const hostID = lobbyID ? lobbies[lobbyID]?.hostID : undefined;
	const isHost = String(user.id) === hostID;
	const isValidLobby = lobbyID && lobbies[lobbyID] ? true : false;

	const isClosingRef = useRef(false);
	const [ joinStatus, setJoinStatus ] = useState<JoinStatus>( isHost ? JoinStatus.ok : JoinStatus.pending );
	const [ popupType, setPopupType ] = useState<PopupType>(PopupType.none);

	useEffect(() =>
	{
		if ( !isValidLobby )
		{
			if ( isClosingRef.current === false )
				setError(ErrorType.lobbyDoesNotExist);
			return;
		}
		if ( !isHost )
		{
			const errorType = joinLobby(lobbyID!, String(user.id));
			const status = errorType === ErrorType.none ? JoinStatus.ok : JoinStatus.failed;
			setJoinStatus(status);
			if ( errorType !== ErrorType.none)
				setError(errorType);
		}
	}, [isValidLobby, isHost, lobbyID, user.id]);

	// I'm returning Background instead of null to prevent a jarring screen flash.
	// It essentially serves as an intermediary 'loading' screen.
	// From what AI's been telling me: this is because React Router v7 wraps navigate()'s
	// internal state update in React's startTransition by default. That makes it a
	// deferred, low-priority update, so it no longer lands in the same commit as
	// closeLobby's setLobbies (an immediate update) — the two used to batch together
	// in RR6, but don't anymore.
	if ( isClosingRef.current === true )
		return <Background />;
	if ( !isValidLobby || joinStatus === JoinStatus.failed )
	{
		const path = location.state && location.state.from ? location.state.from : RoutePath.mainMenu;
		return <Navigate to={path} replace />;
	}
	if ( joinStatus === JoinStatus.pending )
		return <Background />;

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Lobby" />
				<LobbyWindow lobbyID={lobbyID!} />
				{ isHost && <HostButtons lobbyID={lobbyID!} setPopupType={setPopupType} isClosingRef={isClosingRef} /> }
				{ !isHost && <GuestButtons lobbyID={lobbyID!} /> }
				<SideBar />
				{ popupType === PopupType.inviteFriend && <Popup> <InviteFriendPopup setPopupType={setPopupType} /> </Popup> }
			</Page>
		</>
	);
}
