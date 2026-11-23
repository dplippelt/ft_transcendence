import styles from "./Profile.module.scss";
import AccountTab from "./AccountTab";
import { BackButton } from "../../components/Buttons";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { BottomButtons } from "../../components/ButtonContainers";
import { MenuTitle } from "../../components/PageTitle";
import { RoutePath } from "../../utils/utils";
import SideBar from "../../components/SideBar";

function ProfileWindow()
{
	return (
		<div className={styles.profileWindow}>
			<AccountTab />
		</div>
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
				<BottomButtons>
					<BackButton fallback={RoutePath.mainMenu} />
				</BottomButtons>
				<SideBar />
			</Page>
		</>
	);
}
