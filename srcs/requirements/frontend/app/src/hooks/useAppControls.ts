import type { AppStates, SetAppStates } from "../App"

export default function useAppControls( states: AppStates, setStates: SetAppStates )
{
	void states;

	function toggleExamples()
	{
		setStates.setExample_1(prev => !prev);
		setStates.setExample_2(prev => !prev);
	}

	return	{
				toggleExamples,
			};
}
