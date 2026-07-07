import { useNavigate } from "react-router-dom";
import type React from "react";
import styles from "./Buttons.module.scss";
import { EditWindowType } from "../pages/Profile/enums";
import { MessageCircle, MessageCircleWarning, SendHorizontal, Swords, UserMinus } from "lucide-react";
import Avatar, { AvatarSize } from "./Avatar";
import { MobilePosition } from "../utils/utils";

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

interface IOpenChatSideBar
{
	hasNewMsg: boolean;
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

export function FriendButton( { username, avatar, onClick } : IFriendButton )
{
	return (
		<button className={styles.friendButton} type="button" onClick={onClick}>
			<Avatar src={avatar} alt={`${username}'s avatar`} size={AvatarSize.smaller} />
			<div className={styles.friendUsername}>{username}</div>
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

export function OpenChatSideBarButton( { hasNewMsg, onClick } : IOpenChatSideBar )
{
	if ( hasNewMsg )
		return (
			<button className={styles.sideBarButton} onClick={onClick}>
				<MessageCircleWarning size={40} />
			</button>
		);

	return (
		<button className={styles.sideBarButton} onClick={onClick}>
			<MessageCircle size={30} />
		</button>
	);
}
