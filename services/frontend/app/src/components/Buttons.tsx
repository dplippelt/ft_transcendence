import { useNavigate } from "react-router-dom";
import type React from "react";
import styles from "./Buttons.module.scss";
import { PopupType, AvatarSize, MobilePosition, RoutePath, SortBy } from "../utils/utils";
import { ArrowDown01, ArrowDown10, ArrowDownAZ, ArrowDownZA, ChevronLeft, Dot, MessageCircle, MessageCircleWarning, RefreshCcw, SendHorizontal, Swords, User, UserMinus } from "lucide-react";
import Avatar from "./Avatar";
import { useChatHistory } from "../contexts/ChatHistoryContext";
import { useLobbies } from "../contexts/LobbiesContext";
import { useUser } from "../contexts/UserContext";
import { ErrorType, isErrorType } from "../utils/errors";
import { useError } from "../contexts/ErrorContext";

interface IMenuButton
{
	label: string;
	onClick: () => void;
}

interface IMossButton
{
	label: string;
	onClick: () => void;
	extraStyling?: string;
	disabled?: boolean;
	mobilePosition?: string;
}

interface IBottomButton
{
	label: string;
	onClick: () => void;
	disabled?: boolean;
	mobilePosition?: string;
}

interface IBackButton
{
	path: string;
}

interface IEditButton
{
	popupType: PopupType;
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

interface ITextButton
{
	label: string;
	onClick: () => void;
	extraStyling?: string;
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
	friendID: string;
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

interface IJoinButton
{
	lobbyID: string;
}

interface IColumnButton
{
	label: string;
	onClick: () => void;
	sortBy?: SortBy;
	extraStyling?: string;
}

interface IRefreshButton
{
	onClick: () => void;
}

export function MenuButton( { label, onClick } : IMenuButton )
{
	return <button className={styles.menuButton} type="button" onClick={onClick}>{label}</button>
}

export function MossButton( { label, onClick, extraStyling="", disabled=false, mobilePosition="" } : IMossButton )
{
	return <button className={`${styles.mossButton} ${extraStyling} ${mobilePosition}`} type="button" disabled={disabled} onClick={onClick}>{label}</button>;
}

export function BottomButton( { label, onClick, disabled=false, mobilePosition="" } : IBottomButton )
{
	return <button className={`${styles.bottomButton} ${mobilePosition}`} type="button" disabled={disabled} onClick={onClick}>{label}</button>;
}

export function BackButton( { path } : IBackButton )
{
	const navigate = useNavigate();

	return <BottomButton label="Back" onClick={ () => navigate(path) } mobilePosition={MobilePosition.bottom} />;
}

export function EditButton( { popupType, setPopupType } : IEditButton )
{
	return <MossButton label="Edit" onClick={ () => setPopupType(popupType) } extraStyling={styles.editButton}/>;
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

export function FriendButton( { username, friendID, avatar, panel, onClick } : IFriendButton )
{
	const { countUnreadMsg } = useChatHistory();
	const numUnreadMsg = countUnreadMsg(friendID);

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
			<button className={styles.sideBarButton} type="button" aria-label="Toggle chat side bar" title="Toggle chat" onClick={onClick}>
				<MessageCircleWarning size={30} className={styles.newMsgGlow} />
			</button>
		);

	return (
		<button className={styles.sideBarButton} type="button" aria-label="Toggle chat side bar" title="Toggle chat" onClick={onClick}>
			<MessageCircle size={30} />
		</button>
	);
}

export function SideBarBackButton( { onClick } : ISideBarBackButton )
{
	return (
		<button className={styles.actionButton} type="button" aria-label="Return to side bar friends list" title="Back" onClick={onClick}>
			<ChevronLeft />
		</button>
	);
}

export function JoinButton( { lobbyID } : IJoinButton )
{
	const navigate = useNavigate();
	const { lobbies } = useLobbies();
	const lobby = lobbies[lobbyID];
	const disabled: boolean = !lobby || lobby.guestID !== null ? true : false;

	function onClick()
	{
		navigate(RoutePath.mpLobby + `/${lobbyID}`, { state: { from: RoutePath.mpBrowser } });
	}

	return <MossButton label="Join" onClick={onClick} extraStyling={styles.joinButton} disabled={disabled} />;
}

export default function ColumnButton( { label, onClick, sortBy, extraStyling="" } : IColumnButton )
{
	function SortIcon()
	{
		switch ( sortBy )
		{
			case SortBy.name:
				return <ArrowDownAZ className={styles.sortIcon} />;
			case SortBy.nameRev:
				return <ArrowDownZA className={styles.sortIcon} />;
			case SortBy.players:
				return <ArrowDown01 className={styles.sortIcon} />;
			case SortBy.playersRev:
				return <ArrowDown10 className={styles.sortIcon} />;
			default:
				return null;
		}
	}

	function getSortDescription() : string | null
	{
		switch ( sortBy )
		{
			case SortBy.name:
				return "sorted name ascending";
			case SortBy.nameRev:
				return "sorted name descending";
			case SortBy.players:
				return "sorted player count ascending";
			case SortBy.playersRev:
				return "sorted player count descending";
			case SortBy.noSort:
				return "not sorted";
			default:
				return null;
		}
	}

	const sortDescription = getSortDescription();
	const ariaLabel = sortDescription ? `${label}, ${sortDescription}` : label;

	return (
		<button
			className={`${styles.columnButton} ${extraStyling}`}
			type="button"
			onClick={onClick}
			aria-label={ariaLabel}
		>
			<div>{label}</div>
			{ SortIcon() }
		</button>
	);
}

export function RefreshButton( { onClick } : IRefreshButton )
{
	return (
		<button className={styles.refreshButton} type="button" aria-label="Refresh lobbies list" title="Refresh" onClick={onClick} >
			<RefreshCcw />
		</button>
	);
}
