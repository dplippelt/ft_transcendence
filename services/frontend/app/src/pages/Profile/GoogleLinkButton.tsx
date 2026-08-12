import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

import ErrorText from "../../components/ErrorText";
import Popup from "../../components/Popup";
import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";

import { useAuth, useCurrentUser } from "../../contexts/AuthContext";
import { ErrorType, mapAuthApiError } from "../../utils/errors";


export default function GoogleLinkButton()
{
    const user = useCurrentUser();
    const { linkGoogle, unlinkGoogle } = useAuth();

    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showUnlinkConfirmation, setShowUnlinkConfirmation]
        = useState<boolean>(false);

    const isGoogleLinked = user.linked_providers.includes("google");
    const hasPassword = user.linked_providers.includes("password");

    async function handleUnlink()
    {
        if (isSubmitting || !hasPassword)
            return;

        setError(ErrorType.none);
        setIsSubmitting(true);

        try
        {
            await unlinkGoogle();
            setShowUnlinkConfirmation(false);
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

    if (isGoogleLinked)
    {
        return (
            <div>
                {error !== ErrorType.none && !showUnlinkConfirmation &&
                    <ErrorText error={error}/>
                }

                <MossButton
                    label="Unlink Google"
                    onClick={() =>
                    {
                        setError(ErrorType.none);
                        setShowUnlinkConfirmation(true);
                    }}
                    disabled={!hasPassword || isSubmitting}
                    />

                {!hasPassword &&
                    <div>
                        Set a password before unlinking Google.
                    </div>
                }

                {showUnlinkConfirmation &&
                    <Popup>
                        <>
                            {error !== ErrorType.none &&
                                <ErrorText error={error}/>
                            }

                            <p>
                                Unlink Google?
                            </p>

                            <p>
                                You will no longer be able to sign in with Google.
                                You can continue signing in with your password.
                            </p>

                            <PopupButtons>
                                <MossButton
                                    label="Cancel"
                                    onClick={() =>
                                        setShowUnlinkConfirmation(false)
                                    }
                                    disabled={isSubmitting}
                                />

                                <MossButton
                                    label={
                                        isSubmitting
                                            ? "Unlinking..."
                                            : "Unlink"
                                    }
                                    onClick={() => void handleUnlink()}
                                    disabled={isSubmitting}
                                />
                            </PopupButtons>
                        </>
                    </Popup>
                }
            </div>
        );
    }

    if (isSubmitting)
    {
        return (
            <div> Submitting... </div>
        );
    }

    return (
        <div>
            { error !== ErrorType.none && <ErrorText error={error}/> }

            <GoogleLogin
                theme="filled_black"
                shape="rectangular"
                text="continue_with"
                onSuccess={async credentialResponse =>
                {
                    if (!credentialResponse.credential)
                    {
                        setError(ErrorType.googleLoginFailed,);
                        return;
                    }

                    setError(ErrorType.none);
                    setIsSubmitting(true);

                    try
                    {
                        await linkGoogle(credentialResponse.credential,);
                    }
                    catch (error)
                    {
                        setError(mapAuthApiError(error),);
                    }
                    finally
                    {
                        setIsSubmitting(false);
                    }
                }}
                onError={() =>
                {
                    setError(ErrorType.googleLoginFailed);
                }}
            />
        </div>
    );
}
