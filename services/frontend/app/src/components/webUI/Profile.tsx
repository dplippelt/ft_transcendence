import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.scss";
import { useState } from "react";
import AccountTab from "./AccountTab";
import StatsTab from "./StatsTab";

enum Tab
{
	account,
	stats,
}

interface ProfileTabsProps
{
	tab: Tab,
	setTab: React.Dispatch<React.SetStateAction<Tab>>,
}

function PageTitle()
{
	return <div className="menuTitle">Profile</div>
}

function ProfileTabs( { tab, setTab } : ProfileTabsProps )
{
	return (
		<div className={styles.tabs}>
			<div className={styles.tab} style={ tab !== Tab.account ? { borderBottom: "none" } : {} } onClick={ () => setTab(Tab.account) }>ACCOUNT</div>
			<div className={styles.tab} style={ tab !== Tab.stats ? { borderBottom: "none" } : {} } onClick={ () => setTab(Tab.stats) }>STATS</div>
		</div>
	);
}

function ProfileWindow()
{
	const [tab, setTab] = useState<Tab>(Tab.account);

	return (
		<div className={styles.profileWindow}>
			<ProfileTabs tab={tab} setTab={setTab} />
			{ tab === Tab.account ? <AccountTab /> : <StatsTab />}
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
