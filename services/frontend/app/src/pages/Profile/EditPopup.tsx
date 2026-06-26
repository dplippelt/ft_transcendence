import { useRef, useState } from "react";
import type React from "react";
import { AccountError } from "../../utils/errors";
import styles from "./EditPopup.module.scss";
import { PopupButtons } from "../../components/ButtonContainers";
import ErrorText from "../../components/ErrorText";
import { MossButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";
import guestAvatar from  "../../assets/guest_avatar_test.jpg";
import testAvatar from "../../assets/mesca_avatar_test.png";
import { PasswordInput, TextInput } from "../../components/TextInput";
import { EditWindowType } from "./enums";

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
	const user = useUser();

	function handleUpload(e: React.ChangeEvent<HTMLInputElement>)
	{
		const file = e.target.files?.[0];
		if ( !file )
			return;
		if ( file.type !== "image/png" && file.type !== "image/jpeg" )
			return setError(AccountError.avatarBadFileType);
		const uploadedAvatar = URL.createObjectURL(file); // upload to database later and fetch from there (and revoke object URL after upload to DB and get real URL).
		avatarCheck(uploadedAvatar);
	}

	function avatarCheck(newAvatar: string)
	{
		user.updateAvatar(newAvatar); //also update database
		setEditWindowType(EditWindowType.none);
	}

	// start temp list of example avatars
	const avatars =
	[
		guestAvatar,
		testAvatar,
	]
	// end temp list of example avatars

	return (
		<>
			{ error !== AccountError.none && <ErrorText error={error}/> }
			<label className={styles.avatarsLabel}>Pick an avatar</label>
			<div className={styles.avatars}>
				{ avatars.map((avatar, idx) => (
					<img key={avatar} className="avatar" src={avatar} onClick={ () => avatarCheck(avatar) } alt={`Avatar ${idx + 1}`} />
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
	const user = useUser();

	function usernameCheck()
	{
		// Mock username check
		if ( username.length === 0 )
			return setError(AccountError.usernameCannotBeEmpty);
		if ( username.length === 1 )
			return setError(AccountError.usernameAlreadyTaken);

		user.updateUsername(username); //also update database
		setEditWindowType(EditWindowType.none);
	}

	return (
		<>
			{ error !== AccountError.none && <ErrorText error={error}/> }
			<TextInput label="Edit username:" placeholder="Enter new username" setter={setUsername} id="newUsername" />
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
			<PasswordInput label="Edit password:" placeholder="Enter new password" isNewPassword={true} setter={setPassword} id="newPassword" />
			<PasswordInput label="Confirm password:" placeholder="Confirm new password" isNewPassword={true} setter={setConfirmPassword} id="confirmPassword" />
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
			return null;
	}
}
