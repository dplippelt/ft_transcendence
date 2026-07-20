import { useEffect, useState } from "react";

export default function useIsMobile( maxWidth: number) : boolean
{
	const [isMobile, setIsMobile] = useState<boolean>(window.matchMedia(`(max-width: ${maxWidth}px)`).matches);

	useEffect(() =>
	{
		const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);
		const eventHandler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mediaQuery.addEventListener("change", eventHandler);
		return () => mediaQuery.removeEventListener("change", eventHandler);
	}, [maxWidth]);

	return isMobile;
}
