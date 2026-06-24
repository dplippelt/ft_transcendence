import { useRef, useState } from "react";
import { AccountError } from "../../utils/errors";
import styles from "./EditPopup.module.scss";
import { EditWindowType } from "../../pages/Profile/AccountTab";
import { PopupButtons } from "../../components/ButtonContainers";
import ErrorText from "../../components/ErrorText";
import { MossButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";

interface IEditPopup
{
	editWindowType: EditWindowType;
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>;
}

interface IEditContent
{
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>;
}

function EditAvatarContent( { setEditWindowType } : IEditContent )
{
	const [error, setError] = useState<AccountError>(AccountError.none);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { setUser } = useUser();

	function handleUpload(e: React.ChangeEvent<HTMLInputElement>)
	{
		const file = e.target.files?.[0];
		if ( !file )
			return;
		if ( file.type !== "image/png" && file.type !== "image/jpeg" )
			return setError(AccountError.avatarBadFileType);
		const uploadedAvatar = URL.createObjectURL(file); // upload to database later and fetch from there.
		avatarCheck(uploadedAvatar);
	}

	function avatarCheck(newAvatar: string)
	{
		setUser(prev => ({ ...prev, avatar: newAvatar })); //also update database
		setEditWindowType(EditWindowType.none);
	}

	// start temp list of example avatars
	const avatars =
	[
		"/src/assets/guest_avatar_test.jpg",
		"/src/assets/mesca_avatar_test.png",
	]
	// end temp list of example avatars

	return (
		<>
			{ error !== AccountError.none && <ErrorText error={error}/> }
			<div className="text" style={{ textAlign: "center" }}>Pick an avatar</div>
			<div className={styles.avatars}>
				{ avatars.map((avatar, idx) => (
					<img key={idx} className="avatar" src={avatar} onClick={ () => avatarCheck(avatar) } />
				))}
			</div>
			<PopupButtons>
				<MossButton label="Back" onClick={ () => setEditWindowType(EditWindowType.none) } mobilePosition="mobileBottom" />
				<MossButton label="Upload" onClick={ () => fileInputRef.current?.click() } mobilePosition="mobileBottom" />
				<input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={ handleUpload } />
			</PopupButtons>
		</>
	)
}

function EditUsernameContent( { setEditWindowType } : IEditContent )
{
	const [error, setError] = useState<AccountError>(AccountError.none);
	const [username, setUsername] = useState<string>("");
	const { setUser } = useUser();

	function usernameCheck()
	{
		// Mock username check
		if ( username.length === 0 )
			return setError(AccountError.usernameCannotBeEmpty);
		if ( username.length === 1 )
			return setError(AccountError.usernameAlreadyTaken);

		setUser(prev => ({ ...prev, username: username })); //also update database
		setEditWindowType(EditWindowType.none);
	}

	return (
		<>
			{ error !== AccountError.none && <ErrorText error={error}/> }
			<div className="text">Edit username:</div>
			<input className="textInput" autoComplete="off" type="text" placeholder="Enter new username" onChange={ (e) => setUsername(e.target.value) }/>
			<PopupButtons>
				<MossButton label="Back" onClick={ () => setEditWindowType(EditWindowType.none) } />
				<MossButton label="Ok" onClick={ usernameCheck } />
			</PopupButtons>
		</>
	)
}

function EditPasswordContent( { setEditWindowType } : IEditContent )
{
	const [error, setError] = useState<AccountError>(AccountError.none);
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");

	function passwordCheck()
	{
		// Mock username check
		if ( password.length === 0 )
			return setError(AccountError.passwordCannotBeEmpty);
		if ( password !== confirmPassword )
			return setError(AccountError.passwordsDontMatch);

		// update password in database
		setEditWindowType(EditWindowType.none);
	}

	return (
		<>
			{ error !== AccountError.none && <ErrorText error={error}/> }
			<div className="text">Edit password:</div>
			<input className="textInput" autoComplete="off" type="password" placeholder="Enter new password" onChange={ (e) => setPassword(e.target.value) }/>
			<div className="text">Repeat password:</div>
			<input className="textInput" autoComplete="off" type="password" placeholder="Enter new password again" onChange={ (e) => setConfirmPassword(e.target.value) }/>
			<PopupButtons>
				<MossButton label="Back" onClick={ () => setEditWindowType(EditWindowType.none) } />
				<MossButton label="Ok" onClick={ passwordCheck } />
			</PopupButtons>
		</>
	)
}

export default function EditPopup( { editWindowType, setEditWindowType } : IEditPopup )
{
	switch (editWindowType)
	{
		case EditWindowType.username:
			return <EditUsernameContent setEditWindowType={setEditWindowType} />
		case EditWindowType.password:
			return <EditPasswordContent setEditWindowType={setEditWindowType} />
		case EditWindowType.avatar:
			return <EditAvatarContent setEditWindowType={setEditWindowType} />
		default:
			return;
	}
}
