import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useRef } from "react"
import LandingPage from "./pages/LandingPage/LandingPage"
import MainMenu from "./pages/MainMenu/MainMenu"
import Settings from "./pages/Settings/Settings"
import PhaserGame, { type IRefPhaserGame } from "./pages/PhaserGame/PhaserGame"
import Leaderboard from "./pages/Leaderboard/Leaderboard"
import Profile from "./pages/Profile/Profile"
import Auth from "./pages/Auth/Auth"

export default function App()
{
	//  References to the PhaserGame component (game and scene are exposed)
	const phaserRef = useRef<IRefPhaserGame | null>(null);

	// Event emitted from the PhaserGame component
	const currentScene = (scene: Phaser.Scene) => {
    console.log(`current loaded scene: ${scene.scene.key}`);
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={ <LandingPage/> } />
				<Route path="/auth" element={ <Auth/> } />
				<Route path="/main-menu" element={ <MainMenu/> } />
				<Route path="/profile" element={ <Profile/> } />
				<Route path="/leaderboard" element={ <Leaderboard/> } />
				<Route path="/settings" element={ <Settings/> } />
				<Route path="/game-dev" element={ <PhaserGame ref={ phaserRef } currentActiveScene={ currentScene } /> } />
			</Routes>
		</BrowserRouter>
	)
}
