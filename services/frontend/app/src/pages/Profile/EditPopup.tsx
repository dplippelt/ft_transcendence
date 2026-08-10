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
import { TextInput, PasswordInput } from "../../components/TextInput";
import Avatar from "../../components/Avatar";
import { getValidUsername } from "../../utils/usernameCheck";
import { useAuth, useCurrentUser } from "../../contexts/AuthContext";

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
    const user = useCurrentUser();
    const { updatePassword } = useAuth();

    const hasPassword = user.linked_providers.includes("password");
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    async function passwordCheck()
    {
        if (isSubmitting)
            return;
        
        setError(ErrorType.none);

        if (hasPassword && !currentPassword)
        {
            setError(ErrorType.currentPasswordRequired);
            return;
        }

        if (!newPassword)
        {
            setError(ErrorType.passwordCannotBeEmpty);
            return;
        }
        
        if (newPassword.length < 8)
        {
            setError(ErrorType.passwordTooShort);
            return;
        }

        if (newPassword !== confirmPassword)
        {
            setError(ErrorType.passwordsDontMatch);
            return;
        }

        if (hasPassword && newPassword === currentPassword)
        {
            setError(ErrorType.passwordSameAsCurrent);
            return;
        }

        setIsSubmitting(true);

        try
        {
            await updatePassword({
                new_password: newPassword,
                ...(hasPassword &&
                {
                    current_password: currentPassword,
                }),
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
            { error !== ErrorType.none && <ErrorText error={error}/> }

            {hasPassword &&
                <PasswordInput
                    label="Current password:"
                    placeholder="Enter current password"
                    isNewPassword={false}
                    setter={setCurrentPassword}
                    id="currentPassword"
                />
            }

            <PasswordInput
                label={ hasPassword ? "New password:" : "Set password:" }
                placeholder="Enter new password"
                isNewPassword={true}
                setter={setNewPassword}
                id="newPassword"
            />

            <PasswordInput
                label="Confirm password:"
                placeholder="Confirm new password"
                isNewPassword={true}
                setter={setConfirmPassword}
                id="confirmPassword"
            />

            <PopupButtons>
                <MossButton
                    label={ hasPassword ? "Change password" : "Set password" }
                    onClick={() => void passwordCheck()}
                    disabled={isSubmitting}
                />

                <MossButton
                    label="Back"
                    onClick={ () => setPopupType(PopupType.none) }
                    disabled={isSubmitting}
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
