import { useState } from "react";
import QRCode from "react-qr-code";
import type React from "react";
import { GoogleLogin } from "@react-oauth/google";

import { PasswordInput, TextInput } from "../../components/TextInput";
import { MossButton } from "../../components/Buttons";
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
    const {setupTwoFactor, confirmTwoFactor,} = useAuth();
    const [step, setStep]  = useState<SetupStep>("reauthenticate");
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [verificationCode, setVerificationCode] = useState<string>("");
    const [provisioningUri, setProvisioningUri] = useState<string>("");
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const hasPassword = user.linked_providers.includes("password");
    const hasGoogle = user.linked_providers.includes("google");
    const [copied, setCopied] = useState<boolean>(false);

    async function copyRecoveryCodes()
    {
        const text = recoveryCodes.join("\n");

        await navigator.clipboard.writeText(text);
        setCopied(true);
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
        setIsSubmitting(true);

        try
        {
            const codes = await confirmTwoFactor(code);

            setRecoveryCodes(codes);
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
                <p>
                    Two-factor authentication is now enabled.
                </p>

                <p>
                    Save these recovery codes somewhere safe.
                    Each code can only be used once.
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
                        label="Done"
                        onClick={() =>
                            setPopupType(PopupType.none)
                        }
                    />
                    <MossButton
                        label={copied ? "Copied!" : "Copy all"}
                        onClick={() => void copyRecoveryCodes()}
                    />
                </PopupButtons>
            </>
        )
    }

    if (user.two_factor_enabled)
    {
        return (
            <>
                <p>
                    Two-factor authentication is enabled.
                </p>
    
                ...
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
                    <>
                        <PasswordInput
                            label="Current password:"
                            placeholder="Enter current password"
                            isNewPassword={false}
                            setter={setCurrentPassword}
                            id="twoFactorCurrentPassword"
                        />

                        <MossButton
                            label={
                                isSubmitting
                                    ? "Checking..."
                                    : "Continue"
                            }
                            onClick={() => void handlePasswordSetup()}
                            disabled={isSubmitting}
                        />
                    </>
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
                                setError(ErrorType.googleLoginFailed,);
                                return;
                            }

                            void beginSetup({google_credential: credentialResponse.credential,});
                        }}
                        onError={() =>setError(ErrorType.googleLoginFailed,)}
                    />
                }

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

    if (step === "confirm")
    {
        const secret = getSecret();

        return (
            <>
                {error !== ErrorType.none && <ErrorText error={error}/>}

                <p>
                    Scan this QR code with your authenticator app.
                </p>

                <QRCode value={provisioningUri} size={180} />

                <p>
                    Can't scan the QR code?
                </p>

                <code>
                    {secret}
                </code>

                <TextInput
                    label="Authentication code:"
                    placeholder="Enter 6-digit code"
                    setter={setVerificationCode}
                    id="twoFactorSetupCode"
                />

                <PopupButtons>
                    <MossButton
                        label={
                            isSubmitting
                                ? "Verifying..."
                                : "Enable 2FA"
                        }
                        onClick={() => void handleConfirm()}
                        disabled={isSubmitting}
                    />

                    <MossButton
                        label="Cancel"
                        onClick={() => setPopupType(PopupType.none)}
                        disabled={isSubmitting}
                    />
                </PopupButtons>
            </>
        );
    }

    return (
        <>
            <p>
                Two-factor authentication is now enabled.
            </p>

            <p>
                Save these recovery codes somewhere safe.
                Each code can only be used once.
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
                    label="Done"
                    onClick={() => setPopupType(PopupType.none)}
                />
            </PopupButtons>
        </>
    );
}
