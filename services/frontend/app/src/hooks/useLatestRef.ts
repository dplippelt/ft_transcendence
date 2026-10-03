import { useEffect, useRef } from "react";

// Keeps a ref in sync with the latest value of something, so an async
// callback that closed over a stale render (a .then/.catch, a WebSocket
// listener, a setTimeout) can read the current value instead of the one
// from whenever the closure was created.
export default function useLatestRef<T>( value: T )
{
	const ref = useRef(value);

	useEffect(() =>
	{
		ref.current = value;
	}, [value]);

	return ref;
}
