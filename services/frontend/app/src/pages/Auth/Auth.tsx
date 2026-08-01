import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MenuTitle } from "../../components/PageTitle";
import styles from "./Auth.module.scss";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { useAuth } from "../../contexts/AuthContext";
import ErrorText from "../../components/ErrorText";
import { RouteParam, RoutePath } from "../../utils/utils";
import { ErrorType, isErrorType, mapAuthApiError } from "../../utils/errors";
import { MossButton, TextButton } from "../../components/Buttons";
import { PasswordInput, TextInput } from "../../components/TextInput";
import { getValidUsername } from "../../utils/usernameCheck";
import { GoogleLogin } from "@react-oauth/google";
import { getValidEmail } from "../../utils/emailCheck";


interface GoogleAuthButtonProps
{
    setError: (error: ErrorType) => void;
}

function GoogleAuthButton({ setError }: GoogleAuthButtonProps)
{
    const navigate = useNavigate();
    const { loginWithGoogle } = useAuth();

    return (
        <GoogleLogin
            theme="filled_black"
            shape="rectangular"
            text="continue_with"
            onSuccess={async (credentialResponse) =>
            {
                if (!credentialResponse.credential)
                    return setError(ErrorType.googleLoginFailed);

                try
                {
                    setError(ErrorType.none);

                    await loginWithGoogle(
                        credentialResponse.credential,
                    );

                    navigate(RoutePath.mainMenu);
                }
                catch (error)
                {
                    setError(mapAuthApiError(error));
                }
            }}
            onError={() =>
            {
                setError(ErrorType.googleLoginFailed);
            }}
        />
    );
}

function LoginForm()
{
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    
    const navigate = useNavigate();
    const { login } = useAuth();

    async function checkLogin( event: React.FormEvent<HTMLFormElement> )
    {
        event.preventDefault();

        if (isSubmitting)
            return;

        setError(ErrorType.none);

        const emailResult = getValidEmail(email);

        if (isErrorType(emailResult))
            return setError(emailResult);

        if (password.length === 0)
            return setError(ErrorType.passwordCannotBeEmpty);

        const validEmail = emailResult;

        setIsSubmitting(true);

        try
        {
            await login(
            {
                email: validEmail,
                password,
            });

            navigate(RoutePath.mainMenu);
        }
        catch (err)
        {
            setError(mapAuthApiError(err));
        }
        finally
        {
            setIsSubmitting(false);
        }
    }

    return (
        <form
            className={styles.window}
            onSubmit={checkLogin}
            noValidate
        >
            {error !== ErrorType.none &&
                <ErrorText error={error}/>
            }
    
            <TextInput
                type="email"
                label="Email:"
                placeholder="Enter email"
                setter={setEmail}
                id="email"
            />
    
            <PasswordInput
                label="Password:"
                placeholder="Enter password"
                isNewPassword={false}
                setter={setPassword}
                id="password"
            />
    
            <MossButton
                label="Login"
                type="submit"
                disabled={isSubmitting}
            />

            <GoogleAuthButton setError={setError}/>
    
            <TextButton
                label="Don't have an account? Sign-up"
                onClick={() =>
                    navigate(RoutePath.auth + RouteParam.signup)
                }
            />
        </form>
    );
}

function SignupForm()
{
    const [email, setEmail] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const navigate = useNavigate();
    const { register } = useAuth();

    async function signupCheck(event: React.FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        if (isSubmitting)
            return;
        setError(ErrorType.none);

        const emailResult: string | ErrorType = getValidEmail(email);

        if (isErrorType(emailResult))
            return setError(emailResult);

        const validEmail = emailResult;
        const usernameResult: string | ErrorType = getValidUsername(username);

        if (isErrorType(usernameResult))
            return setError(usernameResult);

        const validUsername = usernameResult;

        if (password.length < 8)
            return setError(ErrorType.passwordTooShort);

        if (password !== confirmPassword)
            return setError(ErrorType.passwordsDontMatch);

        setIsSubmitting(true);

        try
        {
            await register(
            {
                email: validEmail,
                username: validUsername,
                password,
            });

            navigate(RoutePath.mainMenu);
        }
        catch (err)
        {
            setError(mapAuthApiError(err));
        }
        finally
        {
            setIsSubmitting(false);
        }
	}

	return (
        <form
            className={styles.window}
            onSubmit={signupCheck}
            noValidate
        >
			{error !== ErrorType.none &&
				<ErrorText error={error}/>
			}

            <TextInput
                type="email"
				label="Email:"
				placeholder="Enter email"
				setter={setEmail}
				id="newEmail"
			/>

            <TextInput
				label="Username:"
				placeholder="Enter new username"
				setter={setUsername}
				id="newUsername"
			/>

			<PasswordInput
				label="Password:"
				placeholder="Enter new password"
				isNewPassword={true}
				setter={setPassword}
				id="newPassword"
			/>

			<PasswordInput
				label="Confirm password:"
				placeholder="Confirm new password"
				isNewPassword={true}
				setter={setConfirmPassword}
				id="confirmPassword"
			/>

			<MossButton
				label="Sign-up"
                type="submit"
                disabled={isSubmitting}
			/>

			<GoogleAuthButton setError={setError} />

			<TextButton
				label="Already have an account? Login"
				onClick={() =>
					navigate(RoutePath.auth + RouteParam.login)
				}
			/>
		</form>
	);
}

function Login()
{
	return (
		<>
			<Background/>
			<Page>
				<MenuTitle title="Login"/>
				<LoginForm/>
			</Page>
		</>
	);
}

function Signup()
{
	return (
		<>
			<Background/>
			<Page>
				<MenuTitle title="Sign-up"/>
				<SignupForm/>
			</Page>
		</>
	);
}

export default function Auth()
{
	const [searchParams] = useSearchParams();
	const mode = searchParams.get("mode");

	switch (mode)
	{
		case "login":
			return <Login/>
		case "signup":
			return <Signup/>
		default:
			return <Navigate to={RoutePath.auth + RouteParam.login} replace />;
	}
}
