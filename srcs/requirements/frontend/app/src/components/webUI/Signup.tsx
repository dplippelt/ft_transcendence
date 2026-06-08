import { useState } from "react";
import { useNavigate } from "react-router-dom";

enum SignupError
{
	none,
	usernameAlreadyTaken,
	passwordsDontMatch
}

function PageTitle()
{
	return <div className="pageTitle">Sign-up</div>
}

function SignupQuery()
{
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [error, setError] = useState<SignupError>(SignupError.none);
	const navigate = useNavigate();

	function signupCheck()
	{
		// if username has been taken setError(SignupError.usernameAlreadyExists)
		// else if password !=== confirmPassword setError(SignupError.passwordsDontMatch)
		// else naviagte("/main-menu")

		// Mock signup check
		if ( username.length === 1 )
			return setError(SignupError.usernameAlreadyTaken);
		if ( password !== confirmPassword )
			return setError(SignupError.passwordsDontMatch);
		navigate("/main-menu");
	}

	function errorMsg(): string
	{
		switch (error)
		{
			case SignupError.usernameAlreadyTaken:
				return "Username already taken!";
			case SignupError.passwordsDontMatch:
				return "Passwords don't match!";
			default:
				return "";
		}
	}

	return (
		<div className="loginSignupQuery">
			{ error !== SignupError.none && <div className="incorrectCreds">{ errorMsg() }</div> }
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

	// return (
	// 	<div className="loginSignupQuery">
	// 		{ error !== SignupError.none && <div className="incorrectCreds">{ errorMsg() }</div> }
	// 		<div className="text">Username:</div>
	// 		<input className="textInput" autoComplete="off" type="text" placeholder="Enter new username" onChange={ (e) => setUsername(e.target.value) }/>
	// 		<div className="text">Password:</div>
	// 		<input className="textInput" autoComplete="off" type="password" placeholder="Enter new password" onChange={ (e) => setPassword(e.target.value) }/>
	// 		<div className="text">Repeat password:</div>
	// 		<input className="textInput" autoComplete="off" type="password" placeholder="Enter new password again" onChange={ (e) => setConfirmPassword(e.target.value) }/>
	// 		<div className="loginSignupButtons">
	// 			<button className="buttonV1" onClick={ () => navigate("/login") }>Login</button>
	// 			<button className="buttonV1" onClick={ signupCheck }>Sign-up</button>
	// 		</div>
	// 		<button className="buttonV1">Continue with Google</button>
	// 	</div>
	// );
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
