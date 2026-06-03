import { useNavigate } from "react-router-dom";

function PageTitle()
{
	return <div className="pageTitle">Sign-up</div>
}

function SignupQuery()
{
	const navigate = useNavigate();

	return (
		<div className="loginSignupQuery">
			<div className="text">Username:</div>
			<input className="textInput" type="text" placeholder="Enter new username"/>
			<div className="text">Password:</div>
			<input className="textInput" type="text" placeholder="Enter new password"/>
			<div className="text">Repeat password:</div>
			<input className="textInput" type="text" placeholder="Enter new password again"/>
			<div className="loginSignupButtons">
				<button className="buttonV1" onClick={ () => navigate("/login") }>Login</button>
				<button className="buttonV1">Sign-up</button>
			</div>
			<button className="buttonV1">Continue with Google</button>
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
