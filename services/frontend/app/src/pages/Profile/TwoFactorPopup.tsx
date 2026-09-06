import { useState } from "react";
import QRCode from "react-qr-code";
import type React from "react";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./TwoFactorPopup.module.scss";

import { PasswordInput, TextInput } from "../../components/TextInput";
import { MossButton, TextButton, } from "../../components/Buttons";
import { PopupButtons } from "../../components/ButtonContainers";
import ErrorText from "../../components/ErrorText";

import {
    useAuth,
    useCurrentUser,
} from "../../contexts/AuthContext";

import type {
    TwoFactorSetupRequest,
} from "../../api/authApi";

import {
    ErrorType,
    mapAuthApiError,
} from "../../utils/errors";

import { PopupType } from "../../utils/utils";

interface TwoFactorPopupProps
{
    setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

type SetupStep =
    | "reauthenticate"
    | "confirm"
    | "recovery";

export default function TwoFactorPopup({ setPopupType, }: TwoFactorPopupProps)
{
    const user = useCurrentUser();
    const {
        setupTwoFactor,
        confirmTwoFactor,
        disableTwoFactor,
        regenerateTwoFactorRecoveryCodes,
    } = useAuth();
    const [step, setStep]  = useState<SetupStep>("reauthenticate");
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [verificationCode, setVerificationCode] = useState<string>("");
    const [provisioningUri, setProvisioningUri] = useState<string>("");
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showManualKey, setShowManualKey] = useState<boolean>(false);
    const [secretCopied, setSecretCopied] = useState<boolean>(false);
    const [recoveryCodesRegenerated, setRecoveryCodesRegenerated] = useState<boolean>(false);
    const hasPassword = user.linked_providers.includes("password");
    const hasGoogle = user.linked_providers.includes("google");
    const [copied, setCopied] = useState<boolean>(false);

    async function copyRecoveryCodes()
    {
        try
        {
            await navigator.clipboard.writeText(recoveryCodes.join("\n"),);
            setCopied(true);
        }
        catch
        {
            setCopied(false);
            setError(ErrorType.recoveryCodesCopyFailed);
        }
    }

    async function copySetupKey(secret: string)
    {
        try
        {
            await navigator.clipboard.writeText(secret);
            setSecretCopied(true);
        }
        catch
        {
            setSecretCopied(false);
        }
    }

    async function beginSetup(data: TwoFactorSetupRequest,)
    {
        if (isSubmitting)
            return;

        setError(ErrorType.none);
        setIsSubmitting(true);

        try
        {
            const response = await setupTwoFactor(data);

            setProvisioningUri(response.provisioning_uri,);

            setStep("confirm");
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

    async function handlePasswordSetup()
    {
        if (!currentPassword)
        {
            setError(ErrorType.currentPasswordRequired);
            return;
        }

        await beginSetup({ current_password: currentPassword, });
    }

    async function handleConfirm()
    {
        if (isSubmitting)
            return;

        const code = verificationCode.trim();

        setError(ErrorType.none);

        if (!code)
        {
            setError(ErrorType.twoFactorCodeRequired);
            return;
        }

        setIsSubmitting(true);

        try
        {
            const codes = await confirmTwoFactor(code);

            setRecoveryCodes(codes);
            setRecoveryCodesRegenerated(false);
            setStep("recovery");
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

    async function handleDisable()
    {
        if (isSubmitting)
            return;
        const code = verificationCode.trim();

        setError(ErrorType.none);
        
        if (!code)
        {
            setError(ErrorType.twoFactorCodeRequired);
            return;
        }

        setIsSubmitting(true);

        try
        {
            await disableTwoFactor(code);
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

    async function handleRegenerateRecoveryCodes()
    {
        if (isSubmitting)
            return;

        const code = verificationCode.trim();

        setError(ErrorType.none);

        if (!code)
        {
            setError(ErrorType.twoFactorCodeRequired);
            return;
        }
        
        setIsSubmitting(true);

        try
        {
            const codes = await regenerateTwoFactorRecoveryCodes(code);
            setRecoveryCodes(codes);
            setCopied(false);
            setRecoveryCodesRegenerated(true);
            setStep("recovery");
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

    function getSecret(): string
    {
        if (!provisioningUri)
            return "";

        try
        {
            return (
                new URL(provisioningUri)
                    .searchParams
                    .get("secret")
                ?? ""
            );
        }
        catch
        {
            return "";
        }
    }

    if (step === "recovery")
    {
        return (
            <>
                {error !== ErrorType.none && <ErrorText error={error}/>}

                <p>
                    {recoveryCodesRegenerated
                        ? "New recovery codes generated."
                        : "Two-factor authentication is now enabled."
                    }
                </p>
    
                <p>
                    {recoveryCodesRegenerated
                        ?
                        (
                            "Your previous recovery codes are now invalid. " +
                            "Save these new codes somewhere safe."
                        )
                        :
                        (
                            "Save these recovery codes somewhere safe. " +
                            "Each code can only be used once."
                        )
                    }
                </p>
    
                <div>
                    {recoveryCodes.map(code =>
                        <div key={code}>
                            <code>{code}</code>
                        </div>
                    )}
                </div>
    
                <PopupButtons>
                    <MossButton
                        label={copied ? "Copied!" : "Copy all"}
                        onClick={() => void copyRecoveryCodes()}
                    />
    
                    <MossButton
                        label="Done"
                        onClick={() => setPopupType(PopupType.none)}
                    />
                </PopupButtons>
            </>
        );
    }

    if (user.two_factor_enabled)
    {
        return (
            <>
                {error !== ErrorType.none && <ErrorText error={error}/>}
    
                <p>
                    Two-factor authentication is enabled.
                </p>
    
                <p>
                    Enter your current authenticator code
                    to manage two-factor authentication.
                </p>
    
                <TextInput
                    label="Authentication code:"
                    placeholder="Enter authentication code"
                    setter={setVerificationCode}
                    id="twoFactorManageCode"
                />
    
                <PopupButtons>
                    <MossButton
                        label={
                            isSubmitting
                                ? "Processing..."
                                : "Regenerate recovery codes"
                        }
                        onClick={() => void handleRegenerateRecoveryCodes()}
                        disabled={isSubmitting}
                    />
    
                    <MossButton
                        label="Disable 2FA"
                        onClick={() => void handleDisable()}
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

    if (step === "reauthenticate")
    {
        return (
            <>
                {error !== ErrorType.none && <ErrorText error={error}/>}
    
                <p>
                    Confirm your identity before enabling
                    two-factor authentication.
                </p>
    
                {hasPassword &&
                    <PasswordInput
                        label="Current password:"
                        placeholder="Enter current password"
                        isNewPassword={false}
                        setter={setCurrentPassword}
                        id="twoFactorCurrentPassword"
                    />
                }
    
                {hasPassword && hasGoogle &&
                    <p>Or continue with Google:</p>
                }
    
                {hasGoogle &&
                    <GoogleLogin
                        theme="filled_black"
                        shape="rectangular"
                        text="continue_with"
                        onSuccess={credentialResponse =>
                        {
                            if (!credentialResponse.credential)
                            {
                                setError( ErrorType.googleLoginFailed, );
                                return;
                            }
    
                            void beginSetup({ google_credential: credentialResponse.credential, });
                        }}
                        onError={() => setError(ErrorType.googleLoginFailed,)}
                    />
                }
    
                <PopupButtons>
                    {hasPassword &&
                        <MossButton
                            label={
                                isSubmitting
                                    ? "Checking..."
                                    : "Continue"
                            }
                            onClick={() => void handlePasswordSetup()}
                            disabled={isSubmitting}
                        />
                    }
    
                    <MossButton
                        label="Back"
                        onClick={() => setPopupType(PopupType.none)}
                        disabled={isSubmitting}
                    />
                </PopupButtons>
            </>
        );
    }

    if (step === "confirm")
    {
        const secret = getSecret();

        return (
            <>
                {error !== ErrorType.none && <ErrorText error={error}/>}

                <div className={styles.twoFactorSetup}>
                <p className={styles.twoFactorInstruction}>
                    Scan this QR code with your
                    authenticator app.
                </p>

                <div className={styles.qrCode}>
                    <QRCode
                        value={provisioningUri}
                        size={180}
                    />
                </div>

                <TextButton
                    label={
                        showManualKey
                            ? "Hide setup key"
                            : "Can't scan? Show setup key"
                    }
                    onClick={() =>
                        setShowManualKey(current => !current)
                    }
                />

                {showManualKey &&
                    <div className={styles.manualSetup}>
                        <p>
                            Manual setup key:
                        </p>

                        <code className={styles.setupKey}>
                            {secret}
                        </code>

                        <TextButton
                            label={
                                secretCopied
                                    ? "Copied!"
                                    : "Copy setup key"
                            }
                            onClick={() =>
                                void copySetupKey(secret)
                            }
                        />
                    </div>
                }

                <TextInput
                    label="Authentication code:"
                    placeholder="Enter 6-digit code"
                    setter={setVerificationCode}
                    id="twoFactorSetupCode"
                />
            </div>

            <PopupButtons>
                <MossButton
                    label={
                        isSubmitting
                            ? "Verifying..."
                            : "Enable 2FA"
                    }
                    onClick={() =>
                        void handleConfirm()
                    }
                    disabled={isSubmitting}
                />

                <MossButton
                    label="Cancel"
                    onClick={() =>
                        setPopupType(PopupType.none)
                    }
                    disabled={isSubmitting}
                />
            </PopupButtons>
        </>
    );}

    return null;
}
