import { EventBus } from "../../game/EventBus";
import { GameEvent } from "../../utils/utils";
import { OpenGameMenuButton } from "../Buttons";
import GameMenu from "../GameMenu";
import SideBar from "../SideBar";

interface IGameUI
{
	gameMenuVis: boolean;
	loggedIn: boolean;
}

export default function GameUI( { gameMenuVis, loggedIn } : IGameUI )
{
	return (
		<>
			{ gameMenuVis && <GameMenu /> }
			{ loggedIn && <SideBar /> }
			<OpenGameMenuButton onClick={ () => EventBus.emit(GameEvent.gameMenu) } />
		</>
	);
}
