import { useState } from "react";
import { useAccount } from "../../contexts/AccountContext";
import { errorMsg, AccountError } from "./Signup";
import styles from "./EditWindow.module.scss";
import { EditWindowType } from "./AccountTab";

interface EditWindowProps
{
	editWindowType: EditWindowType,
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>,
}

interface EditWindowContent
{
	editWindowType: EditWindowType,
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>,
	setError: React.Dispatch<React.SetStateAction<AccountError>>,
}

interface EditContentProp
{
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>,
	setError: React.Dispatch<React.SetStateAction<AccountError>>,
}

function EditAvatarContent( { setEditWindowType, setError } : EditContentProp )
{
	// const [avatar, setAvatar] = useState<string>("");
	const { setAccount } = useAccount();

	function avatarCheck(newAvatar: string)
	{
		setAccount(prev => ({ ...prev, avatar: newAvatar })); //also update database
		setEditWindowType(EditWindowType.none);
	}

	const avatars =
	[
		"/src/assets/guest_avatar_test.jpg",
		"/src/assets/mesca_avatar_test.png",
	]

	// change to list available default avatar as images to pick from.
	return (
		<>
			<div className="text">Edit avatar:</div>
			<div className={styles.avatars}>
				{ avatars.map((avatar, idx) => (
					<img key={idx} className="avatar" src={avatar} onClick={ () => avatarCheck(avatar) } />
				))}
			</div>
			<div className="popupButtons">
				<button className="buttonV1" onClick={ () => setEditWindowType(EditWindowType.none) }>Back</button>
			</div>
		</>
	)
}

function EditUsernameContent( { setEditWindowType, setError } : EditContentProp )
{
	const [username, setUsername] = useState<string>("");
	const { setAccount } = useAccount();

	function usernameCheck()
	{
		// Mock username check
		if ( username.length === 0 )
			return setError(AccountError.usernameCannotBeEmpty);
		if ( username.length === 1 )
			return setError(AccountError.usernameAlreadyTaken);

		setAccount(prev => ({ ...prev, username: username })); //also update database
		setEditWindowType(EditWindowType.none);
	}

	return (
		<>
			<div className="text">Edit username:</div>
			<input className="textInput" autoComplete="off" type="text" placeholder="Enter new username" onChange={ (e) => setUsername(e.target.value) }/>
			<div className="popupButtons">
				<button className="buttonV1" onClick={ () => setEditWindowType(EditWindowType.none) }>Back</button>
				<button className="buttonV1" onClick={ usernameCheck }>OK</button>
			</div>
		</>
	)
}

function EditPasswordContent( { setEditWindowType, setError } : EditContentProp )
{
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const { setAccount } = useAccount();

	function passwordCheck()
	{
		// Mock username check
		if ( password.length === 0 )
			return setError(AccountError.passwordCannotBeEmpty);
		if ( password !== confirmPassword )
			return setError(AccountError.passwordsDontMatch);

		setAccount(prev => ({ ...prev, password: password })); //also update database
		setEditWindowType(EditWindowType.none);
	}

	return (
		<>
			<div className="text">Edit password:</div>
			<input className="textInput" autoComplete="off" type="password" placeholder="Enter new password" onChange={ (e) => setPassword(e.target.value) }/>
			<div className="text">Repeat password:</div>
			<input className="textInput" autoComplete="off" type="password" placeholder="Enter new password again" onChange={ (e) => setConfirmPassword(e.target.value) }/>
			<div className="popupButtons">
				<button className="buttonV1" onClick={ () => setEditWindowType(EditWindowType.none) }>Back</button>
				<button className="buttonV1" onClick={ passwordCheck }>OK</button>
			</div>
		</>
	)
}

function EditWindowContent( { editWindowType, setEditWindowType, setError } : EditWindowContent )
{
	switch (editWindowType)
	{
		case EditWindowType.username:
			return <EditUsernameContent setEditWindowType={setEditWindowType} setError={setError} />
		case EditWindowType.password:
			return <EditPasswordContent setEditWindowType={setEditWindowType} setError={setError} />
		case EditWindowType.avatar:
			return <EditAvatarContent setEditWindowType={setEditWindowType} setError={setError} />
		default:
			return;
	}
}

export default function EditWindow( { editWindowType, setEditWindowType } : EditWindowProps )
{
	const [error, setError] = useState<AccountError>(AccountError.none);

	return (
		<div className={styles.backdrop}>
			<div className={styles.editWindow}>
				{ error !== AccountError.none && <div className="incorrectCreds">{ errorMsg(error) }</div> }
				<EditWindowContent editWindowType={editWindowType} setEditWindowType={setEditWindowType} setError={setError} />
			</div>
		</div>

	);
}
