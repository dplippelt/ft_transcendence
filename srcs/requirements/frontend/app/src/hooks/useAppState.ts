import { useState } from "react"

export default function useAppState()
{
	const [example_1, setExample_1] = useState<boolean>(false);
	const [example_2, setExample_2] = useState<boolean>(false);

	return	{
				example_1, setExample_1,
				example_2, setExample_2,
			};
}
