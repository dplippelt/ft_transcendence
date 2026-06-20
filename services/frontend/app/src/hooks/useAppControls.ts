import type { AppStates, SetAppStates } from "../App"

export default function useAppControls( states: AppStates, setStates: SetAppStates )
{
	void states;

	function guestLogin()
	{
		setStates.setGuest(true);
	}

	return	{
				guestLogin,
			};
}
