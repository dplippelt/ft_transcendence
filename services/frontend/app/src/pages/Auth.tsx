import { Navigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MenuTitle } from "../components/PageTitle";
import styles from "./Auth.module.scss";
import Background from "../components/Background";
import Page from "../components/Page";
import { useAccount } from "../contexts/AccountContext";
import ErrorText from "../components/ErrorText";
import { AccountError } from "../utils/errors";

function LoginQuery()
{
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<AccountError>(AccountError.none);
	const navigate = useNavigate();
	const account = useAccount();

	function checkLogin()
	{
		//if invalid username + password combo setError(true)
		//else navigate("/main-menu")

		// Mock login check:
		if ( username !== password )
			return setError(AccountError.incorrectCreds);

		account.setAccount( prev => ({ ...prev, guest: false, username: username, password: password }));
		navigate("/main-menu");
	}

	return (
		<div className={styles.window}>
			{ error !== AccountError.none && <ErrorText error={error}/> }
			<div className="text">Username:</div>
			<input type="text" placeholder="Enter username" onChange={ (e) => setUsername(e.target.value) }/>
			<div className="text">Password:</div>
			<input autoComplete="current-password" type="password" placeholder="Enter password" onChange={ (e) => setPassword(e.target.value) }/>
			<button className="buttonV1" onClick={ checkLogin }>Login</button>
			<button className="buttonV1">Continue with Google</button>
			<div className={styles.loginSignupInstead} onClick={ () => navigate("/auth?mode=signup") }>Don't have an account? Sign-up</div>
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
	const account = useAccount();

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

		account.setAccount( prev => ({ ...prev, guest: false, username: username, password: password }));
		navigate("/main-menu");
	}

	return (
		<div className={styles.window}>
			{ error !== AccountError.none && <ErrorText error={error}/> }
			<div className="text">Username:</div>
			<input type="text" placeholder="Enter new username" onChange={ (e) => setUsername(e.target.value) }/>
			<div className="text">Password:</div>
			<input autoComplete="new-password" type="password" placeholder="Enter new password" onChange={ (e) => setPassword(e.target.value) }/>
			<div className="text">Repeat password:</div>
			<input autoComplete="new-password" type="password" placeholder="Enter new password again" onChange={ (e) => setConfirmPassword(e.target.value) }/>
			<button className="buttonV1" onClick={ signupCheck }>Sign-up</button>
			<button className="buttonV1">Continue with Google</button>
			<div className={styles.loginSignupInstead} onClick={ () => navigate("/auth?mode=login") }>Already have an account? Login</div>
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
