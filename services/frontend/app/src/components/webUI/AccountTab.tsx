import { useState } from "react";
import { useAccount } from "../../contexts/AccountContext";
import styles from "./AccountTab.module.scss"
import EditWindow from "./EditWindow";

export enum EditWindowType
{
	none,
	avatar,
	username,
	password,
}

interface EditButtonProps
{
	editType: EditWindowType,
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>,
}

interface AccountInfoProp
{
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>,
}

function EditButton( { editType, setEditWindowType } : EditButtonProps )
{
	return <button className={styles.editButton} onClick={ () => setEditWindowType(editType) }>Edit</button>;
}

function Avatar( { setEditWindowType } : AccountInfoProp )
{
	const { account } = useAccount();

	return (
		<>
			<div className="profileLabel">Avatar:</div>
			<img className="avatar" src={account.avatar} />
			{ account.guest ? <div /> : <EditButton editType={EditWindowType.avatar} setEditWindowType={setEditWindowType} /> }
		</>
	);
}

function Username( { setEditWindowType } : AccountInfoProp )
{
	const { account } = useAccount();

	return (
		<>
			<div className="profileLabel">Username:</div>
			<div className={styles.textInfo}>{account.username}</div>
			{ account.guest ? <div /> : <EditButton editType={EditWindowType.username} setEditWindowType={setEditWindowType} /> }
		</>
	);
}

function Password( { setEditWindowType } : AccountInfoProp )
{
	return (
		<>
			<div className="profileLabel">Password:</div>
			<div />
			<EditButton editType={EditWindowType.password} setEditWindowType={setEditWindowType} />
		</>
	);
}

export default function Account()
{
	const [editWindowType, setEditWindowType] = useState<EditWindowType>(EditWindowType.none);
	const { account } = useAccount();

	return (
		<>
			<div className={styles.accountInfo}>
				<Avatar setEditWindowType={setEditWindowType} />
				<Username setEditWindowType={setEditWindowType} />
				{ account.guest ? <div /> : <Password setEditWindowType={setEditWindowType} />}
				{ editWindowType !== EditWindowType.none && <EditWindow editWindowType={editWindowType} setEditWindowType={setEditWindowType} /> }
			</div>
		</>

	);
}
