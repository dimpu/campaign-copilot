import { useEffect, useRef, useState } from "react";

export function useCopyFlash(
	lastPatchAt: Record<string, number>,
	fieldName: string,
): boolean {
	const [flashing, setFlashing] = useState(false);
	const prevRef = useRef(lastPatchAt[fieldName]);

	useEffect(() => {
		const current = lastPatchAt[fieldName];
		if (current && current !== prevRef.current) {
			prevRef.current = current;
			setFlashing(true);
			const timer = setTimeout(() => setFlashing(false), 1200);
			return () => clearTimeout(timer);
		}
	}, [lastPatchAt, fieldName]);

	return flashing;
}
