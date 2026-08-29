import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<T extends (...args: never[]) => void>(
	callback: T,
	delay: number,
): T {
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const callbackRef = useRef(callback);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	return useCallback(
		(...args: Parameters<T>) => {
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
		},
		[delay],
	) as T;
}
