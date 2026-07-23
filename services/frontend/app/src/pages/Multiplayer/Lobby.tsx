import React, { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import { PopupType, AvatarSize, RoutePath, MobilePosition } from "../../utils/utils";
import { BottomButtons } from "../../components/ButtonContainers";
import { BottomButton } from "../../components/Buttons";
import styles from "./Lobby.module.scss";
import Avatar from "../../components/Avatar";
import { useUser } from "../../contexts/UserContext";
import noAvatar from "../../assets/no_avatar.png";
import { LobbyChatHistory } from "../../components/Chat/ChatHistory";
import { DRAFT_STORAGE_PREFIX, LOBBY_DRAFT, LobbyChatBox } from "../../components/Chat/ChatBox";
import useIsMobile from "../../hooks/useIsMobile";
import InviteFriendPopup from "./LobbyInviteFriendPopup";
import Popup from "../../components/Popup";
import { useLobbies } from "../../contexts/LobbiesContext";

interface PlayersData
{
	hostUsername: string;
	hostAvatar: string;
	guestUsername: string;
	guestAvatar: string;
}

interface IHostButtons
{
	lobbyID: string;
	numPlayers: number;
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

interface IGuestButtons
{
	setNumPlayers: React.Dispatch<React.SetStateAction<number>>;
}

interface IPlayer
{
	username: string;
	avatar: string;
	alt: string;
}

interface IPlayers
{
	players: PlayersData;
}

interface ILobbyWindow
{
	players: PlayersData;
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

function Players( { players } : IPlayers )
{
	return (
		<div className={styles.players}>
			<Player username={players.hostUsername} avatar={players.hostAvatar} alt="Host avatar" />
			<Player username={players.guestUsername} avatar={players.guestAvatar} alt="Guest avatar" />
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

function LobbyWindow( { players } : ILobbyWindow )
{
	return (
		<div className={styles.lobbyWindow}>
			<Players players={players} />
			<Chat />
		</div>
	);
}

function HostButtons( { lobbyID, numPlayers, setPopupType } : IHostButtons )
{
	const navigate = useNavigate();
	const { closeLobby } = useLobbies();

	function onCloseLobby()
	{
		localStorage.removeItem(DRAFT_STORAGE_PREFIX + LOBBY_DRAFT);
		navigate(RoutePath.mainMenu); // intentional back to main menu instead of multiplayer page
		setTimeout(() => closeLobby(lobbyID), 50); // using a timeout so Lobby has time to unmount before lobbies state updates. Otherwise the early return for a non-existent lobby causes a brief screen flash.
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

function GuestButtons( { setNumPlayers } : IGuestButtons )
{
	const navigate = useNavigate();

	function onLeaveLobby()
	{
		setNumPlayers(prev => prev - 1);
		localStorage.removeItem(DRAFT_STORAGE_PREFIX + LOBBY_DRAFT);
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
	const { lobbies } = useLobbies();
	const { lobbyID } = useParams();
	const { user } = useUser();

	const hostID = lobbyID ? lobbies[lobbyID]?.hostID : undefined;
	const isHost = user.userID === hostID;

	const [ players, _setPlayers ] = useState<PlayersData>(initPlayers); // TODO: needs to update when a second player joins (WebSockets)
	const [ numPlayers, setNumPlayers ] = useState<number>( isHost ? 1 : 2 ); // TODO: needs to update when a second player joins (WebSockets)
	const [ popupType, setPopupType ] = useState<PopupType>(PopupType.none);

	if ( !lobbyID || !lobbies[lobbyID] )
		return <Navigate to={RoutePath.mainMenu} />;

	function initPlayers() : PlayersData
	{
		if ( isHost )
		{
			return {
				hostUsername: user.username,
				hostAvatar: user.avatar,
				guestUsername: "Waiting...", // TODO: needs to update and fetch from database when a second player joins (WebSockets)
				guestAvatar: noAvatar, // TODO: needs to update and fetch from database when a second player joins (WebSockets)
			}
		}
		return {
			hostUsername: "Host", // TODO: fetch from database instead
			hostAvatar: noAvatar, // TODO: fetch from database instead
			guestUsername: user.username,
			guestAvatar: user.avatar,
		}
	}

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Lobby" />
				<LobbyWindow players={players} />
				{ isHost && <HostButtons lobbyID={lobbyID} numPlayers={numPlayers} setPopupType={setPopupType} /> }
				{ !isHost && <GuestButtons setNumPlayers={setNumPlayers} /> }
				<SideBar />
				{ popupType === PopupType.inviteFriend && <Popup> <InviteFriendPopup setPopupType={setPopupType} /> </Popup> }
			</Page>
		</>
	);
}
