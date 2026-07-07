import { useNavigate } from "react-router-dom";
import type React from "react";
import styles from "./Buttons.module.scss";
import { EditWindowType } from "../pages/Profile/enums";
import { ChevronLeft, MessageCircle, MessageCircleWarning, SendHorizontal, Swords, UserMinus } from "lucide-react";
import Avatar, { AvatarSize } from "./Avatar";
import { MobilePosition } from "../utils/utils";
import { useUser } from "../contexts/UserContext";
import { Dot } from "lucide-react";

interface IMenuButton
{
	label: string;
	onClick: () => void;
}

interface IMossButton
{
	label: string;
	onClick: () => void;
	extraStyling?: string,
	mobilePosition?: string;
}

interface IBottomButton
{
	label: string;
	onClick: () => void;
	mobilePosition?: string;
}

interface IBackButton
{
	path: string;
}

interface IEditButton
{
	editType: EditWindowType;
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>;
}

interface ITextButton
{
	label: string;
	onClick: () => void;
	extraStyling?: string,
}

interface ITabButton
{
	label: string;
	isSelected: boolean;
	onClick: () => void;
}

interface IFriendButton
{
	username: string;
	avatar: string;
	panel: boolean;
	onClick: () => void;
}

interface ISendButton
{
	onClick: () => void;
}

interface IActionButton
{
	onClick: () => void;
}

interface IOpenSideBarButton
{
	hasNewMsg: boolean;
	onClick: () => void;
}

interface ISideBarBackButton
{
	onClick: () => void;
}

export function MenuButton( { label, onClick } : IMenuButton )
{
	return <button className={styles.menuButton} type="button" onClick={onClick}>{label}</button>
}

export function MossButton( { label, onClick, extraStyling="", mobilePosition="" } : IMossButton )
{
	return <button className={`${styles.mossButton} type="button" ${extraStyling} ${mobilePosition}`} onClick={onClick}>{label}</button>;
}

export function BottomButton( { label, onClick, mobilePosition="" } : IBottomButton )
{
	return <button className={`${styles.bottomButton} type="button" ${mobilePosition}`} onClick={onClick}>{label}</button>;
}

export function BackButton( { path } : IBackButton )
{
	const navigate = useNavigate();

	return <BottomButton label="Back" onClick={ () => navigate(path) } mobilePosition={MobilePosition.bottom} />;
}

export function EditButton( { editType, setEditWindowType } : IEditButton )
{
	return <MossButton label="Edit" onClick={ () => setEditWindowType(editType) } extraStyling={styles.editButton}/>;
}

export function TextButton( { label, onClick, extraStyling="" } : ITextButton )
{
	return <button className={`${styles.textButton} ${extraStyling}`} type="button" onClick={onClick}>{label}</button>
}

export function TabButton( { label, isSelected, onClick } : ITabButton )
{
	return <button className={ isSelected ? styles.tabSelected : styles.tabNotSelected } type="button" onClick={onClick}>{label}</button>
}

export function SendButton( { onClick } : ISendButton )
{
	return (
		<button className={styles.sendButton} type="button" aria-label="Send message" title="Send"  onClick={onClick}>
			<SendHorizontal />
		</button>
	);
}

export function FriendButton( { username, avatar, panel, onClick } : IFriendButton )
{
	const userFunc = useUser();
	const numUnreadMsg = userFunc.numUnreadMsg(username);

	function usernameStyle() : string
	{
		let usernameStyle = styles.friendUsername;

		if ( numUnreadMsg )
			usernameStyle += " " + styles.friendUnread;

		return usernameStyle;
	}

	return (
		<button className={styles.friendButton} type="button" onClick={onClick}>
			<Avatar src={avatar} alt={`${username}'s avatar`} size={AvatarSize.smaller} />
			<div className={usernameStyle()}>{username}</div>
			{ !panel && numUnreadMsg !== 0 && <div className={usernameStyle()}>{"(" + (numUnreadMsg > 99 ? "99+" : numUnreadMsg) + ")"}</div> }
			{ panel && numUnreadMsg !== 0 && <Dot size={24} /> }
		</button>
	)
}

export function InviteToPlayButton( { onClick } : IActionButton )
{
	return (
		<button className={styles.actionButton} type="button" aria-label="Invite user to co-op game" title="Invite to co-op" onClick={onClick}>
			<Swords size={20} />
		</button>
	);
}

export function RemoveFriendButton( { onClick } : IActionButton )
{
	return (
		<button className={styles.actionButton} type="button" aria-label="Remove user from friends list" title="Remove friend" onClick={onClick}>
			<UserMinus size={20} />
		</button>
	);
}

export function OpenSideBarButton( { hasNewMsg, onClick } : IOpenSideBarButton )
{
	if ( hasNewMsg )
		return (
			<button className={styles.sideBarButton} onClick={onClick}>
				<MessageCircleWarning size={30} className={styles.newMsgGlow} />
			</button>
		);

	return (
		<button className={styles.sideBarButton} onClick={onClick}>
			<MessageCircle size={30} />
		</button>
	);
}

export function SideBarBackButton( { onClick } : ISideBarBackButton )
{
	return (
		<button className={styles.actionButton} onClick={onClick}>
			<ChevronLeft />
		</button>
	);
}
