import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useRef } from "react"
import useAppControls from "./hooks/useAppControls"
import useAppEffects from "./hooks/useAppEffects"
import useAppState from "./hooks/useAppState"
import CardTest from "./card_test/CardTest"
import LandingPage from "./components/webUI/LandingPage"
import Login from "./components/webUI/Login"
import Signup from "./components/webUI/Signup"
import MainMenu from "./components/webUI/MainMenu"
import PhaserGame, { type IRefPhaserGame } from "./components/webUI/PhaserGame"

export type AppStates =
{
	guest: boolean,
}

export type SetAppStates =
{
	setGuest: React.Dispatch<React.SetStateAction<boolean>>,
}

export type Controls =
{
	guestLogin: () => void,
}

export default function App()
{
	//  References to the PhaserGame component (game and scene are exposed)
	const phaserRef = useRef<IRefPhaserGame | null>(null);

	const
	{
		guest, setGuest,
	} = useAppState();

	const states: AppStates =
	{
		guest: guest,
	};

	const setStates: SetAppStates =
	{
		setGuest: setGuest,
	};

	const
	{
		guestLogin,
	} = useAppControls(states, setStates);

	const controls: Controls =
	{
		guestLogin: guestLogin,
	}

  useAppEffects(states, setStates, controls);

	// Event emitted from the PhaserGame component
	const currentScene = (scene: Phaser.Scene) => {
    console.log(`current loaded scene: ${scene.scene.key}`);
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={ <LandingPage controls={controls}/> } />
				<Route path="/login" element={ <Login/> } />
				<Route path="/signup" element={ <Signup/> } />
				<Route path="/main-menu" element={ <MainMenu/> } />
				<Route path="/card-tester" element={ <CardTest /> } />
				<Route path="/game-dev" element={ <PhaserGame ref={ phaserRef } currentActiveScene={ currentScene } /> } />
			</Routes>
		</BrowserRouter>
	)
}
