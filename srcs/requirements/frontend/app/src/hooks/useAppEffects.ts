import { useEffect } from "react"
import type { AppStates, Controls, SetAppStates } from "../App"

export default function useAppEffects( states: AppStates, setStates: SetAppStates, controls: Controls )
{
	void setStates;
	void controls;
	
	useEffect(() =>
	{
		console.log("example_1 changed!");
	}, [states.example_1]);
}
