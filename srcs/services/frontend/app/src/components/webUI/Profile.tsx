import { useNavigate } from "react-router-dom";
import { useAccount } from "../../contexts/AccountContext";
import styles from "./Profile.module.scss";

interface AccountElementProps
{
	label: string,
	value: string,
	edit: boolean,
}

function PageTitle()
{
	return <div className="menuTitle">Profile</div>
}

function AccountAvatar( { label, value, edit } : AccountElementProps )
{
	return (
		<>
			<div className={styles.label}>{`${label}:`}</div>
			<img className={styles.avatar} src={value} />
			{ edit ? <div className={styles.edit}>edit</div> : <div></div> }
		</>
	);
}

function AccountInfo( { label, value, edit } : AccountElementProps )
{
	return (
		<>
			<div className={styles.label}>{`${label}:`}</div>
			<div>{value}</div>
			{ edit ? <div className={styles.edit}>edit</div> : <div></div> }
		</>
	);
}

function Account()
{
	const { account } = useAccount();

	return (
		<>
			<div className={styles.account}>ACCOUNT</div>
			<div className={styles.accountInfo}>
				<AccountAvatar label="Avatar" value={account.avatar} edit={ account.guest ? false : true }/>
				<AccountInfo label="Username" value={account.username} edit={ account.guest ? false : true }/>
			</div>
		</>
	);
}

function ProfileWindow()
{
	return (
		<div className={styles.profileWindow}>
			<Account />
		</div>
	);
}

function Buttons()
{
	const navigate = useNavigate();

	return (
		<div className="bottomButtons">
			<button className="buttonV2 mobileBottom" onClick={ () => navigate(-1) }>Back</button>
		</div>
	);
}

export default function Profile()
{
	return (
		<>
			<div className="background" />
			<div className="page">
				<PageTitle />
				<ProfileWindow />
				<Buttons />
			</div>
		</>
	);
}
