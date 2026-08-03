import { useState } from "react";
import type React from "react";
import styles from "./AccountTab.module.scss";
import sharedStyle from "./Tab.module.scss";
import Popup from "../../components/Popup";
import EditPopup from "./EditPopup";
import { EditButton } from "../../components/Buttons";
import { PopupType, AvatarSize } from "../../utils/utils";
import AvatarImg from "../../components/Avatar";
import { useCurrentUser } from "../../contexts/AuthContext";
import noAvatar from "../../assets/no_avatar.png";

interface IAccountInfo
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

function Avatar( { setPopupType } : IAccountInfo )
{
	const user = useCurrentUser();

	return (
		<>
			<div className={sharedStyle.profileLabel}>Avatar:</div>
			<AvatarImg src={user.avatar_url ?? noAvatar} alt="User avatar" size={AvatarSize.medium} />
			<EditButton popupType={PopupType.editAvatar} setPopupType={setPopupType} />
		</>
	);
}

function Username( { setPopupType } : IAccountInfo )
{
	const user = useCurrentUser();

	return (
		<>
			<div className={sharedStyle.profileLabel}>Username:</div>
			<div className={sharedStyle.textInfo}>{user.username ?? user.display_name ?? "No username"}</div>
			<EditButton popupType={PopupType.editUsername} setPopupType={setPopupType} />
		</>
	);
}

function Password( { setPopupType } : IAccountInfo )
{
	return (
		<>
			<div className={sharedStyle.profileLabel}>Password:</div>
			<div />
			<EditButton popupType={PopupType.editPassword} setPopupType={setPopupType} />
		</>
	);
}

export default function Account()
{
	const [popupType, setPopupType] = useState<PopupType>(PopupType.none);

	return (
		<>
			<div className={styles.accountInfo}>
				<Avatar setPopupType={setPopupType} />
				<Username setPopupType={setPopupType} />
				<Password setPopupType={setPopupType} />
				{ popupType !== PopupType.none && <Popup> <EditPopup  popupType={popupType} setPopupType={setPopupType} /> </Popup> }
			</div>
		</>
	);
}
