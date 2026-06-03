import { BrowserRouter, Routes, Route } from "react-router-dom"
import CardTest from "./card_test/CardTest"
import LandingPage from "./components/webUI/LandingPage"
import useAppControls from "./hooks/useAppControls"
import useAppEffects from "./hooks/useAppEffects"
import useAppState from "./hooks/useAppState"

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
				<Route path="/card_tester" element={ <CardTest/> } />
			</Routes>
		</BrowserRouter>
	)
}
