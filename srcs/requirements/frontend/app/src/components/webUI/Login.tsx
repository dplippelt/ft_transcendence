import { useNavigate } from "react-router-dom";

function PageTitle()
{
	return <div className="pageTitle">Login</div>
}

function LoginQuery()
{
	const navigate = useNavigate();

	return (
		<div className="loginSignupQuery">
			<div className="text">Username:</div>
			<input className="textInput" type="text" placeholder="Enter username"/>
			<div className="text">Password:</div>
			<input className="textInput" type="text" placeholder="Enter password"/>
			<div className="loginSignupButtons">
				<button className="buttonV1" onClick={ () => navigate("/signup") }>Sign-up</button>
				<button className="buttonV1" onClick={ () => navigate("/main-menu") }>Login</button>
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
