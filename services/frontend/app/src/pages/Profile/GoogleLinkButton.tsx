import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

import ErrorText from "../../components/ErrorText";
import { useAuth, useCurrentUser, } from "../../contexts/AuthContext";
import { ErrorType, mapAuthApiError, } from "../../utils/errors";


export default function GoogleLinkButton()
{
    const user = useCurrentUser();
    const { linkGoogle } = useAuth();
    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const [isLinking, setIsLinking] = useState<boolean>(false);
    const isGoogleLinked = user.linked_providers.includes("google");

    if (isGoogleLinked)
    {
        return (
            <div> Linked </div>
        );
    }

    if (isLinking)
    {
        return (
            <div> Linking... </div>
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
                    setIsLinking(true);

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
                        setIsLinking(false);
                    }
                }}
                onError={() =>
                {
                    setError(
                        ErrorType.googleLoginFailed,
                    );
                }}
            />
        </div>
    );
}
