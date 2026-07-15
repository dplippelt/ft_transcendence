import { useNavigate } from "react-router-dom";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import { RoutePath } from "../../utils/utils";
import { MenuButtons } from "../../components/ButtonContainers";
import { MenuButton } from "../../components/Buttons";
import styles from "./Multiplayer.module.scss";
import { useUser } from "../../contexts/UserContext";
import { useLobbies } from "../../contexts/LobbiesContext";

function Buttons()
{
	const navigate = useNavigate();
	const { user } = useUser();
	const { createLobby } = useLobbies();

	function onCreateGame()
	{
		createLobby(user.userID);
		navigate(RoutePath.mpLobby, { state: { from: RoutePath.multiplayer } });
	}

	return (
		<MenuButtons extraStyling={styles.buttonsOffset}>
			<MenuButton label="Create game" onClick={onCreateGame} />
			<MenuButton label="Browse games" onClick={ () => {} } />
			<MenuButton label="Local co-op" onClick={ () => {} } />
			<MenuButton label="Back" onClick={ () => navigate(RoutePath.mainMenu) } />
		</MenuButtons>
	)
}

export default function Multiplayer()
{
	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Multiplayer" />
				<Buttons />
				<SideBar />
			</Page>
		</>
	);
}
