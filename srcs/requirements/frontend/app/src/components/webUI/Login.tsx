import { useState } from "react";
import { useNavigate } from "react-router-dom";

function PageTitle()
{
	return <div className="pageTitle">Login</div>
}

function LoginQuery()
{
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<boolean>(false);
	const navigate = useNavigate();

	function checkLogin()
	{
		//if invalid username + password combo setError(true)
		//else navigate("/main-menu")

		// Mock login check:
		if ( username !== password )
			return setError(true);
		navigate("/main-menu");
	}

	return (
		<div className="loginSignupQuery">
			{ error && <div className="incorrectCreds">Incorrect username or password!</div> }
			<div className="text">Username:</div>
			<input className="textInput" autoComplete="off" type="text" placeholder="Enter username" onChange={ (e) => setUsername(e.target.value) }/>
			<div className="text">Password:</div>
			<input className="textInput" autoComplete="off" type="password" placeholder="Enter password" onChange={ (e) => setPassword(e.target.value) }/>
			<div className="loginSignupButtons">
				<button className="buttonV1" onClick={ () => navigate("/signup") }>Sign-up</button>
				<button className="buttonV1" onClick={ checkLogin }>Login</button>
			</div>
			<button className="buttonV1">Continue with Google</button>
		</div>
	);
}

export default function Login()
{
	return (
		<>
			<div className="background"/>
			<div className="page">
				<PageTitle/>
				<LoginQuery/>
			</div>
		</>
	);
}
