import { Navigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MenuTitle } from "../../components/PageTitle";
import styles from "./Auth.module.scss";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { useAuth } from "../../contexts/AuthContext";
import ErrorText from "../../components/ErrorText";
import { AccountError } from "../../utils/errors";
import { MossButton, TextButton } from "../../components/Buttons";
import { useUser } from "../../contexts/UserContext";
import { PasswordInput, TextInput } from "../../components/TextInput";

function LoginQuery()
{
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<AccountError>(AccountError.none);
	const navigate = useNavigate();
	const auth = useAuth();
	const user = useUser();

	function checkLogin()
	{
		//if invalid username + password combo setError(true)
		//else navigate("/main-menu")

		// Mock login check:
		if ( username !== password )
			return setError(AccountError.incorrectCreds);

		auth.login();
		user.updateUsername(username);
		navigate("/main-menu");
	}

	return (
		<div className={styles.window}>
			{ error !== AccountError.none && <ErrorText error={error}/> }
			<TextInput label="Username:" placeholder="Enter username" setter={setUsername} id="username" />
			<PasswordInput label="Password:" placeholder="Enter password" isNewPassword={false} setter={setPassword} id="password" />
			<MossButton label="Login" onClick={checkLogin} />
			<MossButton label="Continue with Google" onClick={ () => {} } />
			<TextButton label="Don't have an account? Sign-up" onClick={ () => navigate("/auth?mode=signup") } />
		</div>
	);
}

function SignupQuery()
{
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [error, setError] = useState<AccountError>(AccountError.none);
	const navigate = useNavigate();
	const auth = useAuth();
	const user = useUser();

	function signupCheck()
	{
		// if username has been taken setError(AccountError.usernameAlreadyExists)
		// else if password !=== confirmPassword setError(AccountError.passwordsDontMatch)
		// else naviagte("/main-menu")

		// Mock signup check
		if ( username.length === 1 )
			return setError(AccountError.usernameAlreadyTaken);
		if ( password !== confirmPassword )
			return setError(AccountError.passwordsDontMatch);

		auth.login();
		user.updateUsername(username);
		navigate("/main-menu");
	}

	return (
		<div className={styles.window}>
			{ error !== AccountError.none && <ErrorText error={error}/> }
			<TextInput label="Username:" placeholder="Enter new username" setter={setUsername} id="newUsername" />
			<PasswordInput label="Password:" placeholder="Enter new password" isNewPassword={true} setter={setPassword} id="newPassword" />
			<PasswordInput label="Confirm password:" placeholder="Confirm new password" isNewPassword={true} setter={setConfirmPassword} id="confirmPassword" />
			<MossButton label="Sign-up" onClick={signupCheck} />
			<MossButton label="Continue with Google" onClick={ () => {} } />
			<TextButton label="Already have an account? Login" onClick={ () => navigate("/auth?mode=login") } />
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
			return <Navigate to="/auth?mode=login" replace />;
	}
}
