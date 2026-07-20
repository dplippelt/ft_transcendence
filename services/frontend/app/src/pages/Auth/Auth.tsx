import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MenuTitle } from "../../components/PageTitle";
import styles from "./Auth.module.scss";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { useAuth } from "../../contexts/AuthContext";
import ErrorText from "../../components/ErrorText";
import { RouteParam, RoutePath } from "../../utils/utils";
import { ErrorType } from "../../utils/errors";
import { MossButton, TextButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";
import { PasswordInput, TextInput } from "../../components/TextInput";
import { getValidUsername, isErrorType } from "../../utils/usernameCheck";

function LoginQuery()
{
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const navigate = useNavigate();
	const auth = useAuth();
	const user = useUser();

	function checkLogin()
	{
		const result: string | ErrorType = getValidUsername(username);
		if ( isErrorType(result) )
			return setError(result);

		const validUsername = result;

		// TODO: check creds against back-end data.

		// Mock login check:
		if ( validUsername !== password )
			return setError(ErrorType.incorrectCreds);

		auth.login();
		user.updateUsername(validUsername);
		navigate(RoutePath.mainMenu);
	}

	return (
		<div className={styles.window}>
			{ error !== ErrorType.none && <ErrorText error={error}/> }
			<TextInput label="Username:" placeholder="Enter username" setter={setUsername} id="username" />
			<PasswordInput label="Password:" placeholder="Enter password" isNewPassword={false} setter={setPassword} id="password" />
			<MossButton label="Login" onClick={checkLogin} />
			<MossButton label="Continue with Google" onClick={ () => {} } />
			<TextButton label="Don't have an account? Sign-up" onClick={ () => navigate(RoutePath.auth + RouteParam.signup) } />
		</div>
	);
}

function SignupQuery()
{
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [error, setError] = useState<ErrorType>(ErrorType.none);
	const navigate = useNavigate();
	const auth = useAuth();
	const user = useUser();

	function signupCheck()
	{
		const result: string | ErrorType = getValidUsername(username);
		if ( isErrorType(result) )
			return setError(result);

		const validUsername = result;

		// TODO: check creds against back-end data.

		// if username has been taken setError(Error.usernameAlreadyExists)
		// else if password !=== confirmPassword setError(Error.passwordsDontMatch)
		// else naviagte(RoutePath.mainMenu)

		// Mock signup check
		if ( validUsername.length === 1 )
			return setError(ErrorType.usernameAlreadyTaken);
		if ( password !== confirmPassword )
			return setError(ErrorType.passwordsDontMatch);

		auth.login();
		user.setUserID(validUsername + "_ID"); // TODO: Replace with stable userID instead of using username
		user.updateUsername(validUsername);
		navigate(RoutePath.mainMenu);
	}

	return (
		<div className={styles.window}>
			{ error !== ErrorType.none && <ErrorText error={error}/> }
			<TextInput label="Username:" placeholder="Enter new username" setter={setUsername} id="newUsername" />
			<PasswordInput label="Password:" placeholder="Enter new password" isNewPassword={true} setter={setPassword} id="newPassword" />
			<PasswordInput label="Confirm password:" placeholder="Confirm new password" isNewPassword={true} setter={setConfirmPassword} id="confirmPassword" />
			<MossButton label="Sign-up" onClick={signupCheck} />
			<MossButton label="Continue with Google" onClick={ () => {} } />
			<TextButton label="Already have an account? Login" onClick={ () => navigate(RoutePath.auth + RouteParam.login) } />
		</div>
	);
}

function Login()
{
	return (
		<>
			<Background/>
			<Page>
				<MenuTitle title="Login"/>
				<LoginQuery/>
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
				<SignupQuery/>
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
