import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useLobbies } from "../../contexts/LobbiesContext";
import noAvatar from "../../assets/no_avatar.png";
import { LobbyChatHistory } from "../../components/Chat/ChatHistory";
import { DRAFT_STORAGE_PREFIX, LOBBY_DRAFT, LobbyChatBox } from "../../components/Chat/ChatBox";
import useIsMobile from "../../hooks/useIsMobile";
import InviteFriendPopup from "./LobbyInviteFriendPopup";
import Popup from "../../components/Popup";

interface IHostButtons
{
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

function Players()
{
	const { user } = useUser();
	const { getGuestID } = useLobbies();
	const guestID = getGuestID(user.userID);
	const guestAvatar = guestID ? user.avatar : noAvatar; // TODO: if guestID is defined replace with guest's avatar (fetch from database)
	const guestUsername = guestID ? user.username : "Waiting...";

	return (
		<div className={styles.players}>
			<Player username={user.username} avatar={user.avatar} alt="Host avatar" />
			<Player username={guestUsername} avatar={guestAvatar} alt="Guest avatar" />
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

function LobbyWindow()
{
	return (
		<div className={styles.lobbyWindow}>
			<Players />
			<Chat />
		</div>
	);
}

function HostButtons( { numPlayers, setPopupType } : IHostButtons )
{
	const navigate = useNavigate();

	function onCloseLobby()
	{
		localStorage.removeItem(DRAFT_STORAGE_PREFIX + LOBBY_DRAFT);
		navigate(RoutePath.mainMenu); // intentional back to main menu instead of multiplayer page
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
	const { user } = useUser();
	const { lobbyID } = useParams();
	const isHost = user.userID.toLowerCase() === lobbyID ? true : false;
	const [ popupType, setPopupType ] = useState<PopupType>(PopupType.none);
	const [ numPlayers, setNumPlayers ] = useState<number>(isHost ? 1 : 2); // mock implementation, needs backend integration

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Lobby" />
				<LobbyWindow />
				{ isHost && <HostButtons numPlayers={numPlayers} setPopupType={setPopupType} /> }
				{ !isHost && <GuestButtons setNumPlayers={setNumPlayers} /> }
				<SideBar />
				{ popupType === PopupType.inviteFriend && <Popup> <InviteFriendPopup setPopupType={setPopupType} /> </Popup> }
			</Page>
		</>
	);
}
