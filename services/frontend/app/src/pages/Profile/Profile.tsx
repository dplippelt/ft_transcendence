import styles from "./Profile.module.scss";
import { useState } from "react";
import type React from "react";
import AccountTab from "./AccountTab";
import StatsTab from "./StatsTab";
import { BackButton, BottomButton, TabButton } from "../../components/Buttons";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { BottomButtons } from "../../components/ButtonContainers";
import { MenuTitle } from "../../components/PageTitle";
import { useLocation, useNavigate } from "react-router-dom";
import { Tab, RoutePath } from "../../utils/utils";
import SideBar from "../../components/SideBar";

interface IProfileTabs
{
	tab: Tab;
	setTab: React.Dispatch<React.SetStateAction<Tab>>;
}

function ProfileTabs( { tab, setTab } : IProfileTabs )
{
	return (
		<div className={styles.tabs}>
			<TabButton label="ACCOUNT" isSelected={ tab === Tab.account } onClick={ () => setTab(Tab.account) } />
			<TabButton label="STATS" isSelected={ tab === Tab.stats } onClick={ () => setTab(Tab.stats) } />
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
	const navigate = useNavigate();
	const location = useLocation();
	const fromGameMenu = location.state?.gameMenu ?? false;

	// Makes sure it goes back to the game / game menu instead of main menu
	// when the user navigates from:
	// game menu -> profile -> leaderboard -> back to profile -> back to game menu
	function getPath()
	{
		if ( location.state?.gameMenu )
			return RoutePath.game;
		if ( location.state?.from )
			return location.state.from;
		return RoutePath.mainMenu;
	}

	return (
		<BottomButtons>
			<BackButton path={getPath()} />
			<BottomButton label="Leaderboard" onClick={ () => navigate(RoutePath.leaderboard, { state: { from: location.pathname, gameMenu: fromGameMenu } }) } />
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
				<SideBar />
			</Page>
		</>
	);
}
