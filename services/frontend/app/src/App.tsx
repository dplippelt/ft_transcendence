import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useRef } from "react"
import useAppControls from "./hooks/useAppControls"
import useAppEffects from "./hooks/useAppEffects"
import useAppState from "./hooks/useAppState"
import LandingPage from "./pages/LandingPage"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import MainMenu from "./pages/MainMenu"
import Settings from "./pages/Settings"
import PhaserGame, { type IRefPhaserGame } from "./pages/PhaserGame"
import Leaderboard from "./pages/Leaderboard"
import Profile from "./pages/Profile"

export type AppStates =
{
}

export type SetAppStates =
{
}

export type Controls =
{
}

export default function App()
{
	//  References to the PhaserGame component (game and scene are exposed)
	const phaserRef = useRef<IRefPhaserGame | null>(null);

	const
	{
	} = useAppState();

	const states: AppStates =
	{
	};

	const setStates: SetAppStates =
	{
	};

	const
	{
	} = useAppControls(states, setStates);

	const controls: Controls =
	{
	}

  useAppEffects(states, setStates, controls);

	// Event emitted from the PhaserGame component
	const currentScene = (scene: Phaser.Scene) => {
    console.log(`current loaded scene: ${scene.scene.key}`);
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={ <LandingPage/> } />
				<Route path="/login" element={ <Login/> } />
				<Route path="/signup" element={ <Signup/> } />
				<Route path="/main-menu" element={ <MainMenu/> } />
				<Route path="/profile" element={ <Profile/> } />
				<Route path="/leaderboard" element={ <Leaderboard/> } />
				<Route path="/settings" element={ <Settings/> } />
				<Route path="/game-dev" element={ <PhaserGame ref={ phaserRef } currentActiveScene={ currentScene } /> } />
			</Routes>
		</BrowserRouter>
	)
}
