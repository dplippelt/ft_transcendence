import { BrowserRouter, Routes, Route } from "react-router-dom"
import CardTest from "./card_test/CardTest"
import LandingPage from "./components/webUI/LandingPage"
import useAppControls from "./hooks/useAppControls"
import useAppEffects from "./hooks/useAppEffects"
import useAppState from "./hooks/useAppState"

export type AppStates =
{
	example_1: boolean,
	example_2: boolean,
}

export type SetAppStates =
{
	setExample_1: React.Dispatch<React.SetStateAction<boolean>>,
	setExample_2: React.Dispatch<React.SetStateAction<boolean>>,
}

export type Controls =
{
	toggleExamples: () => void,
}

export default function App()
{
	const
	{
		example_1, setExample_1,
		example_2, setExample_2,
	} = useAppState();

	const states: AppStates =
	{
		example_1: example_1,
		example_2: example_2,
	};

	const setStates: SetAppStates =
	{
		setExample_1: setExample_1,
		setExample_2: setExample_2,
	};

	const
	{
		toggleExamples,
	} = useAppControls(states, setStates);

	const controls: Controls =
	{
		toggleExamples: toggleExamples,
	}

	useAppEffects(states, setStates, controls);

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={ <LandingPage states={states} controls={controls} /> } />
				<Route path="/card_tester" element={ <CardTest /> } />
			</Routes>
			{/* <CardTest/> */}
			{/* <LandingPage states={states} controls={controls}/> */}
		</BrowserRouter>
	)
}
