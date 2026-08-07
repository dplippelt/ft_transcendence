import { useState } from "react";
import { Navigate, useLocation, useNavigate, } from "react-router-dom";

import styles from "../Auth/Auth.module.scss";

import Background from "../../components/Background";
import ErrorText from "../../components/ErrorText";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import { MossButton } from "../../components/Buttons";
import { TextInput } from "../../components/TextInput";

import { useAuth, useCurrentUser, } from "../../contexts/AuthContext";

import { ErrorType, isErrorType, mapAuthApiError, } from "../../utils/errors";

import { getValidUsername } from "../../utils/usernameCheck";
import { RoutePath } from "../../utils/utils";

interface CompleteProfileLocationState
{
    from?: string;
}

export default function CompleteProfile()
{
    const user = useCurrentUser();
    const { updateProfile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [username, setUsername] = useState<string>("");
    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const locationState = location.state as CompleteProfileLocationState | null;
    const destination = locationState?.from ?? RoutePath.mainMenu;

    if (user.username)
    {
        return (
            <Navigate
                to={destination}
                replace
            />
        );
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>,)
    {
        event.preventDefault();

        if (isSubmitting)
            return;

        setError(ErrorType.none);
        const result = getValidUsername(username);

        if (isErrorType(result))
        {
            setError(result);
            return;
        }
        setIsSubmitting(true);

        try
        {
            await updateProfile({ username: result, });
            navigate(destination, { replace: true, });
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
            <Background />
            <Page>
                <MenuTitle title="Choose username" />
                <form
                    className={styles.window}
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <p>
                        Choose a username before continuing.
                    </p>
                    {error !== ErrorType.none &&
                        <ErrorText error={error}/>
                    }
                    <TextInput
                        label="Username:"
                        placeholder="Enter username"
                        setter={setUsername}
                        id="completeProfileUsername"
                    />
                    <MossButton
                        label="Continue"
                        type="submit"
                        disabled={isSubmitting}
                    />
                </form>
            </Page>
        </>
    );
}
