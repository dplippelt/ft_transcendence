import { useEffect, useState } from "react";

export default function useIsMobile() : boolean
{
	const [isMobile, setIsMobile] = useState<boolean>(window.matchMedia('(max-width: 480px)').matches);

	useEffect(() =>
	{
		const mediaQuery = window.matchMedia('(max-width: 480px)');
		const eventHandler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mediaQuery.addEventListener("change", eventHandler);
		return () => mediaQuery.removeEventListener("change", eventHandler);
	}, []);

	return isMobile;
}
