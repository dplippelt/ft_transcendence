import { useLocation } from "react-router-dom";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import { RoutePath } from "../../utils/utils";
import { BottomButtons } from "../../components/ButtonContainers";
import { BackButton } from "../../components/Buttons";
import styles from "./Lobby.module.scss";
import Avatar, { AvatarSize } from "../../components/Avatar";
import { useUser } from "../../contexts/UserContext";
import { useLobbies } from "../../contexts/LobbiesContext";
import noAvatar from "../../assets/no_avatar.png";
import { LobbyChatHistory } from "../../components/Chat/ChatHistory";
import { LobbyChatBox } from "../../components/Chat/ChatBox";
import useIsMobile from "../../hooks/useIsMobile";

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

function Buttons()
{
	const location = useLocation();
	const path = location.state?.from ?? RoutePath.multiplayer;

	return (
		<BottomButtons>
			<BackButton path={path} />
		</BottomButtons>
	);
}

export default function Lobby()
{
	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Lobby" />
				<LobbyWindow />
				<Buttons />
				<SideBar />
			</Page>
		</>
	);
}
