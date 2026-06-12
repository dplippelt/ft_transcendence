import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "../../contexts/AccountContext";

export enum AccountError
{
	none,
	usernameAlreadyTaken,
	usernameCannotBeEmpty,
	passwordsDontMatch,
	passwordCannotBeEmpty,
	avatarCannotBeEmpty,
}

export function errorMsg( error: AccountError ): string
{
	switch (error)
	{
		case AccountError.usernameAlreadyTaken:
			return "Username already taken!";
		case AccountError.usernameCannotBeEmpty:
			return "Username cannot be empty!";
		case AccountError.passwordsDontMatch:
			return "Passwords don't match!";
		case AccountError.passwordCannotBeEmpty:
			return "Password cannot be empty!";
		case AccountError.avatarCannotBeEmpty:
			return "Avatar cannot be empty!";
		default:
			return "";
	}
}

function PageTitle()
{
	return <div className="menuTitle">Sign-up</div>
}

function SignupQuery()
{
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [error, setError] = useState<AccountError>(AccountError.none);
	const navigate = useNavigate();
	const { setAccount } = useAccount();

	function signupCheck()
	{
		// if username has been taken setError(SignupError.usernameAlreadyExists)
		// else if password !=== confirmPassword setError(SignupError.passwordsDontMatch)
		// else naviagte("/main-menu")

		// Mock signup check
		if ( username.length === 1 )
			return setError(AccountError.usernameAlreadyTaken);
		if ( password !== confirmPassword )
			return setError(AccountError.passwordsDontMatch);

		setAccount(prev => ({ ...prev, guest: false, username: username, password: password }));
		navigate("/main-menu");
	}

	return (
		<div className="loginSignupQuery">
			{ error !== AccountError.none && <div className="incorrectCreds">{ errorMsg(error) }</div> }
			<div className="text">Username:</div>
			<input className="textInput" autoComplete="off" type="text" placeholder="Enter new username" onChange={ (e) => setUsername(e.target.value) }/>
			<div className="text">Password:</div>
			<input className="textInput" autoComplete="off" type="password" placeholder="Enter new password" onChange={ (e) => setPassword(e.target.value) }/>
			<div className="text">Repeat password:</div>
			<input className="textInput" autoComplete="off" type="password" placeholder="Enter new password again" onChange={ (e) => setConfirmPassword(e.target.value) }/>
			<button className="buttonV1" onClick={ signupCheck }>Sign-up</button>
			<button className="buttonV1">Continue with Google</button>
			<div className="loginSignupInstead" onClick={ () => navigate("/login") }>Already have an account? Login</div>
		</div>
	);
}

export default function Signup()
{
	return (
		<>
			<div className="background"/>
			<div className="page">
				<PageTitle/>
				<SignupQuery/>
			</div>
		</>
	);
}
