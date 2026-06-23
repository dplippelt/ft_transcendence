import styles from "./Profile.module.scss";
import { useState } from "react";
import AccountTab from "./AccountTab";
import StatsTab from "./StatsTab";
import BackButton from "../../components/BackButton";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { BottomButtons } from "../../components/ButtonContainers";
import { MenuTitle } from "../../components/PageTitle";

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
			{ tab === Tab.account ? <AccountTab /> : <StatsTab /> }
		</div>
	);
}

function Buttons()
{
	return (
		<BottomButtons>
			<BackButton />
		</BottomButtons>
	);
}

export default function Profile()
{
	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Profile" />
				<ProfileWindow />
				<Buttons />
			</Page>
		</>
	);
}
