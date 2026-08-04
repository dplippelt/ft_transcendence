import { useState } from "react";
import type React from "react";
import { PopupType, AvatarSize } from "../../utils/utils";
import { ErrorType, isErrorType, mapAuthApiError } from "../../utils/errors";
import styles from "./EditPopup.module.scss";
import { PopupButtons } from "../../components/ButtonContainers";
import ErrorText from "../../components/ErrorText";
import { MossButton } from "../../components/Buttons";
import guestAvatar from "../../assets/guest_avatar_test.jpg";
import testAvatar from "../../assets/mesca_avatar_test.png";
import { TextInput } from "../../components/TextInput";
import Avatar from "../../components/Avatar";
import { getValidUsername } from "../../utils/usernameCheck";
import { useAuth } from "../../contexts/AuthContext";

interface IEditPopup
{
	popupType: PopupType;
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

interface IEditContent
{
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

function EditAvatarContent( { setPopupType } : IEditContent )
{
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const { updateProfile } = useAuth();

	// Temporary local presets until avatar upload/storage is implemented.
	const avatars =
	[
		guestAvatar,
		testAvatar,
	];

	async function avatarCheck(avatar: string)
	{
		if (isSubmitting)
			return;

		setError(ErrorType.none);
		setIsSubmitting(true);

		try
		{
			// Vite asset imports may be relative paths. The backend requires
			// avatar_url to be an absolute HTTP(S) URL.
			const avatarUrl = new URL(
				avatar,
				window.location.origin,
			).href;

			await updateProfile({
				avatar_url: avatarUrl,
			});

			setPopupType(PopupType.none);
		}
		catch (error)
		{
			setError(mapAuthApiError(error));
		}
		finally
		{
			setIsSubmitting(false);
		}
	}

	return (
		<>
			{ error !== ErrorType.none &&
				<ErrorText error={error}/>
			}

			<label className={styles.avatarsLabel}>
				Pick an avatar
			</label>

			<div className={styles.avatars}>
				{ avatars.map((avatar, idx) => (
					<Avatar
						key={avatar}
						src={avatar}
						alt={`Avatar ${idx + 1}`}
						size={AvatarSize.medium}
						onClick={() => void avatarCheck(avatar)}
						extraStyling={styles.avatar}
					/>
				))}
			</div>

			<PopupButtons>
				<MossButton
					label="Back"
					onClick={() => setPopupType(PopupType.none)}
					disabled={isSubmitting}
				/>
			</PopupButtons>
		</>
	);
}

function EditUsernameContent( { setPopupType } : IEditContent )
{
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const [username, setUsername] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { updateProfile } = useAuth();

	async function usernameCheck()
	{
		if (isSubmitting)
			return;

		setError(ErrorType.none);

		const result = getValidUsername(username);

		if (isErrorType(result))
			return setError(result);

		setIsSubmitting(true);

		try
		{
			await updateProfile({
				username: result,
			});

			setPopupType(PopupType.none);
		}
		catch (error)
		{
			setError(mapAuthApiError(error));
		}
		finally
		{
			setIsSubmitting(false);
		}
	}

	return (
		<>
			{ error !== ErrorType.none &&
				<ErrorText error={error}/>
			}

			<TextInput
				label="Edit username:"
				placeholder="Enter new username"
				setter={setUsername}
				id="newUsername"
			/>

			<PopupButtons>
				<MossButton
					label="Ok"
					onClick={() => void usernameCheck()}
					disabled={isSubmitting}
				/>

				<MossButton
					label="Back"
					onClick={() => setPopupType(PopupType.none)}
					disabled={isSubmitting}
				/>
			</PopupButtons>
		</>
	);
}

function EditPasswordContent( { setPopupType } : IEditContent )
{
	return (
		<>
			<label>
				Password changes are not available yet.
			</label>

			<PopupButtons>
				<MossButton
					label="Back"
					onClick={() => setPopupType(PopupType.none)}
				/>
			</PopupButtons>
		</>
	);
}

export default function EditPopup(
	{ popupType, setPopupType } : IEditPopup
)
{
	switch (popupType)
	{
		case PopupType.editUsername:
			return (
				<EditUsernameContent
					setPopupType={setPopupType}
				/>
			);

		case PopupType.editPassword:
			return (
				<EditPasswordContent
					setPopupType={setPopupType}
				/>
			);

		case PopupType.editAvatar:
			return (
				<EditAvatarContent
					setPopupType={setPopupType}
				/>
			);

		default:
			return null;
	}
}
