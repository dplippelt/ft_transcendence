import { FriendButton, InviteToPlayButton, RemoveFriendButton, ChatButton } from "../../components/Buttons";
import { useNavigate } from "react-router-dom";
import { PopupType, MobileView, RoutePath } from "../../utils/utils";
import TheFriendsList from "../../components/FriendsList";
import { useFriends } from "../../contexts/FriendsContext";
import useIsMobile from "../../hooks/useIsMobile";
import styles from "./FriendsWindow.module.scss";

interface IFriendsWindow
{
	setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

function FriendsListTitle()
{
	return <div className={styles.friendsListTitle}>My Friends</div>
}

function FriendsList( { setMobileView, setPopupType } : IFriendsWindow )
{
	const isMobile = useIsMobile(720);
	const navigate = useNavigate();
	const { setSelectedFriendID, setActiveFriendID } = useFriends();

	function handleOpenChat( friendID: string )
	{
		setActiveFriendID(friendID);

		if ( isMobile )
			setMobileView(MobileView.chat);
	}

	function handleInviteToPlay( friendID: string )
	{
		setPopupType(PopupType.inviteFriend);
		setSelectedFriendID(friendID);
	}

	function handleRemoveFriend( friendID: string )
	{
		setPopupType(PopupType.removeFriend);
		setSelectedFriendID(friendID);
	}

	return (
		<TheFriendsList>
			{ (friendID, username, avatar, isOnline) => (
				<>
					<FriendButton username={username} friendID={friendID} avatar={avatar} isOnline={isOnline} panel={false} onClick={ () => navigate(`${RoutePath.profile}/${friendID}`) } />
					<ChatButton onClick={ () => handleOpenChat(friendID) } />
					<InviteToPlayButton onClick={ () => handleInviteToPlay(friendID) } />
					<RemoveFriendButton onClick={ () => handleRemoveFriend(friendID) } />
				</>
			)}
		</TheFriendsList>
	)
}

export default function FriendsWindow( { setMobileView, setPopupType } : IFriendsWindow )
{
	return (
		<div className={styles.friendsWindow}>
			<FriendsListTitle />
			<FriendsList setMobileView={setMobileView} setPopupType={setPopupType} />
		</div>
	)
}
