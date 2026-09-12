import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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

interface TwoFactorRequiredProps
{
    onTwoFactorRequired: (challengeToken: string) => void;
}

interface GoogleAuthButtonProps extends TwoFactorRequiredProps
{
    setError: (error: ErrorType) => void;
}

function GoogleAuthButton({ setError, onTwoFactorRequired }: GoogleAuthButtonProps)
{
    const navigate = useNavigate();
    const { loginWithGoogle } = useAuth();

    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [googleButtonWidth, setGoogleButtonWidth] = useState<number>(0);

    useEffect(() =>
        {
            const element = googleButtonRef.current;

            if (!element)
                return;

            const observer = new ResizeObserver(entries =>
            {
                const width = Math.floor(entries[0].contentRect.width);

                setGoogleButtonWidth(Math.min(width, 400));
            });

            observer.observe(element);

            return () => observer.disconnect();
    }, []);

    return (
        <div className={styles.googleLoginButton} ref={googleButtonRef}>
            {googleButtonWidth > 0 &&
                <GoogleLogin
                    theme="filled_black"
                    shape="rectangular"
                    text="continue_with"
                    width={googleButtonWidth}
                    onSuccess={async (credentialResponse) => {
                        if (!credentialResponse.credential)
                            return setError(ErrorType.googleLoginFailed);

                        try {
                            setError(ErrorType.none);

                            const result = await loginWithGoogle(credentialResponse.credential,);
                            
                            if (result.requiresTwoFactor)
                            {
                                onTwoFactorRequired(result.challengeToken);
                                return;
                            }

                            navigate(RoutePath.mainMenu);
                        }
                        catch (error) {
                            setError(mapAuthApiError(error));
                        }
                    }}
                    onError={() => {
                        setError(ErrorType.googleLoginFailed);
                    }}
            />
            }
        </div>
    );
}

function LoginForm({ onTwoFactorRequired }: TwoFactorRequiredProps)
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
            const result =await login(
            {
                email: validEmail,
                password,
                });
            
            if (result.requiresTwoFactor)
            {
                onTwoFactorRequired(result.challengeToken);
                return;
            }

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
            <GoogleAuthButton setError={setError} onTwoFactorRequired={onTwoFactorRequired}/>
    
            <TextButton
                label="Don't have an account? Sign-up"
                onClick={() =>
                    navigate(RoutePath.auth + RouteParam.signup)
                }
            />
        </form>
    );
}

interface TwoFactorFormProps
{
    challengeToken: string;
    onBack: () => void;
}

function TwoFactorForm({ challengeToken, onBack }: TwoFactorFormProps)
{
    const [verificationCode, setVerificationCode] = useState<string>("");
    const [useRecoveryCode, setUseRecoveryCode] = useState<boolean>(false);
    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const navigate = useNavigate();
    const { loginWithTwoFactor, loginWithRecoveryCode } = useAuth();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>)
    {
        event.preventDefault();

        if (isSubmitting)
            return;

        setError(ErrorType.none);

        const code = verificationCode.trim();
        if (!code)
        {
            setError(
                useRecoveryCode
                    ? ErrorType.twoFactorRecoveryCodeRequired
                    : ErrorType.twoFactorCodeRequired
            );
            return;
        }
        
        setIsSubmitting(true);

        try
        {
            if (useRecoveryCode)
                await loginWithRecoveryCode(challengeToken, code);
            else
                await loginWithTwoFactor(challengeToken, code);

            navigate(RoutePath.mainMenu);
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

    function toggleRecoveryCode()
    {
        if (isSubmitting)
            return;

        setError(ErrorType.none);
        setVerificationCode("");
        setUseRecoveryCode(current => !current);
    }

    function handleBack()
    {
        if (isSubmitting)
            return;

        onBack();
    }

    return (
        <form
            className={styles.window}
            onSubmit={handleSubmit}
            noValidate
        >
            {error !== ErrorType.none && <ErrorText error={error} />}
            
            <p>
                {useRecoveryCode
                    ? "Enter your recovery code:"
                    : "Enter the verification code from your authenticator app:"}
            </p>

            <TextInput
                key={useRecoveryCode ? "recovery" : "totp"}
                label={useRecoveryCode ? "Recovery Code:" : "Authentication Code:"}
                placeholder={useRecoveryCode ? "Enter recovery code" : "Enter authentication code"}
                setter={setVerificationCode}
                id={useRecoveryCode ? "recoveryCode" : "twoFactorCode"}
            />

            <MossButton
                label={isSubmitting ? "Verifying..." : "Continue"}
                type="submit"
                disabled={isSubmitting}
            />
            
            <TextButton
                label={useRecoveryCode ? "Use authentication code" : "Use recovery code"}
                onClick={toggleRecoveryCode}
            />

            <TextButton
                label="Back"
                onClick={handleBack}
            />
        </form>
    );
}

function SignupForm({ onTwoFactorRequired }: TwoFactorRequiredProps)
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

			<GoogleAuthButton setError={setError} onTwoFactorRequired={onTwoFactorRequired}/>

			<TextButton
				label="Already have an account? Login"
				onClick={() =>
					navigate(RoutePath.auth + RouteParam.login)
				}
			/>
		</form>
	);
}

function Login({ onTwoFactorRequired }: TwoFactorRequiredProps)
{
    return (
        <>
            <Background/>
            <Page>
                <MenuTitle title="Login"/>

                <LoginForm onTwoFactorRequired={onTwoFactorRequired}/>
            </Page>
        </>
    );
}

function Signup({ onTwoFactorRequired }: TwoFactorRequiredProps)
{
	return (
		<>
			<Background/>
			<Page>
				<MenuTitle title="Sign-up"/>
				<SignupForm onTwoFactorRequired={onTwoFactorRequired}/>
			</Page>
		</>
	);
}

export default function Auth()
{
    const [searchParams] = useSearchParams();
    const [challengeToken, setChallengeToken] = useState<string | null>(null);

    const mode = searchParams.get("mode");

    if (challengeToken)
    {
        return (
            <>
            <Background />
            <Page>
                <MenuTitle title="Two-factor authentication"/>
                <TwoFactorForm
                    challengeToken={challengeToken}
                    onBack={() => setChallengeToken(null)}
                />
            </Page>
            </>
        );
    }
    switch (mode)
    {
        case "login":
            return <Login onTwoFactorRequired={setChallengeToken}/>
        case "signup":
            return <Signup onTwoFactorRequired={setChallengeToken}/>
        default:
            return <Navigate to={RoutePath.auth + RouteParam.login} replace />;
    }
}
