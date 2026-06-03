import { BrowserRouter, Routes, Route } from "react-router-dom"
import useAppControls from "./hooks/useAppControls"
import useAppEffects from "./hooks/useAppEffects"
import useAppState from "./hooks/useAppState"
import CardTest from "./card_test/CardTest"
import LandingPage from "./components/webUI/LandingPage"
import Login from "./components/webUI/Login"
import Signup from "./components/webUI/Signup"
import MainMenu from "./components/webUI/MainMenu"

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

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={ <LandingPage/> } />
				<Route path="/login" element={ <Login/> } />
				<Route path="/signup" element={ <Signup/> } />
				<Route path="/main-menu" element={ <MainMenu/> } />
				<Route path="/card-tester" element={ <CardTest/> } />
			</Routes>
		</BrowserRouter>
	)
}
