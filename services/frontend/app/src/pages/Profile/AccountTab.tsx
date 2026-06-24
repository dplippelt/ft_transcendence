import { useState } from "react";
import styles from "./AccountTab.module.scss";
import sharedStyle from "./Tab.module.scss";
import Popup from "../../components/Popup";
import EditPopup from "./EditPopup";
import { EditButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";

export enum EditWindowType
{
	none,
	avatar,
	username,
	password,
}

interface AccountInfoProp
{
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>,
}

function Avatar( { setEditWindowType } : AccountInfoProp )
{
	const { user } = useUser();

	return (
		<>
			<div className={sharedStyle.profileLabel}>Avatar:</div>
			<img className="avatar" src={user.avatar} />
			<EditButton editType={EditWindowType.avatar} setEditWindowType={setEditWindowType} />
		</>
	);
}

function Username( { setEditWindowType } : AccountInfoProp )
{
	const { user } = useUser();

	return (
		<>
			<div className={sharedStyle.profileLabel}>Username:</div>
			<div className={styles.textInfo}>{user.username}</div>
			<EditButton editType={EditWindowType.username} setEditWindowType={setEditWindowType} />
		</>
	);
}

function Password( { setEditWindowType } : AccountInfoProp )
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
