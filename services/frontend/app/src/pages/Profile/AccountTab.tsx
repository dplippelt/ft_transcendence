import { useState } from "react";
import type React from "react";
import styles from "./AccountTab.module.scss";
import sharedStyle from "./Tab.module.scss";
import Popup from "../../components/Popup";
import EditPopup from "./EditPopup";
import { EditButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";
import { EditWindowType } from "./enums";
import AvatarImg, { AvatarSize } from "../../components/Avatar";

interface IAccountInfo
{
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>;
}

function Avatar( { setEditWindowType } : IAccountInfo )
{
	const { user } = useUser();

	return (
		<>
			<div className={sharedStyle.profileLabel}>Avatar:</div>
			<AvatarImg src={user.avatar} alt="User avatar" size={AvatarSize.medium} />
			<EditButton editType={EditWindowType.avatar} setEditWindowType={setEditWindowType} />
		</>
	);
}

function Username( { setEditWindowType } : IAccountInfo )
{
	const { user } = useUser();

	return (
		<>
			<div className={sharedStyle.profileLabel}>Username:</div>
			<div className={sharedStyle.textInfo}>{user.username}</div>
			<EditButton editType={EditWindowType.username} setEditWindowType={setEditWindowType} />
		</>
	);
}

function Password( { setEditWindowType } : IAccountInfo )
{
	return (
		<>
			<div className={sharedStyle.profileLabel}>Password:</div>
			<div />
			<EditButton editType={EditWindowType.password} setEditWindowType={setEditWindowType} />
		</>
	);
}

export default function Account()
{
	const [editWindowType, setEditWindowType] = useState<EditWindowType>(EditWindowType.none);

	return (
		<>
			<div className={styles.accountInfo}>
				<Avatar setEditWindowType={setEditWindowType} />
				<Username setEditWindowType={setEditWindowType} />
				<Password setEditWindowType={setEditWindowType} />
				{ editWindowType !== EditWindowType.none && <Popup> <EditPopup  editWindowType={editWindowType} setEditWindowType={setEditWindowType} /> </Popup> }
			</div>
		</>
	);
}
