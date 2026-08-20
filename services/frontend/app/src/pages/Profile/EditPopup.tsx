import { useState } from "react";
import type React from "react";
import { PopupType, } from "../../utils/utils";
import { ErrorType, isErrorType, mapAuthApiError } from "../../utils/errors";
import styles from "./EditPopup.module.scss";
import { PopupButtons } from "../../components/ButtonContainers";
import ErrorText from "../../components/ErrorText";
import { MossButton } from "../../components/Buttons";
import { TextInput, PasswordInput } from "../../components/TextInput";
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
    const [avatar, setAvatar] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const { updateAvatar } = useAuth();

    function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>,)
    {
        const file = event.target.files?.[0];

        setError(ErrorType.none);

        if (!file)
        {
            setAvatar(null);
            return;
        }

        const validTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!validTypes.includes(file.type))
        {
            setAvatar(null);
            setError(ErrorType.avatarBadFileType);
            return;
        }
        setAvatar(file);
    }

    async function handleUpload()
    {
        if (!avatar || isSubmitting)
            return;

        setError(ErrorType.none);
        setIsSubmitting(true);

        try
        {
            await updateAvatar(avatar);
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
                Upload avatar
            </label>

            <div className={styles.uploadAvatar}>
                <label className={styles.fileButton}>
                    Choose file

                    <input
                        className={styles.fileInput}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarChange}
                        disabled={isSubmitting}
                    />
                </label>

                <span className={styles.fileName}>
                    {avatar ? avatar.name : "No file chosen"}
                </span>
            </div>

            <PopupButtons>
                <MossButton
                    label={isSubmitting ? "Uploading..." : "Upload"}
                    onClick={() => void handleUpload()}
                    disabled={!avatar || isSubmitting}
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
