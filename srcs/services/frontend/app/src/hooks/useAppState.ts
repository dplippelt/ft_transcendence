import { useState } from "react"

export default function useAppState()
{
	const [guest, setGuest] = useState<boolean>(false);

	return	{
				guest, setGuest,
			};
}
