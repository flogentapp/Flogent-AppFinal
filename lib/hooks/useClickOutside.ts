import { useEffect, useCallback } from 'react'

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
    const listener = useCallback(
        (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return
            }
            handler()
        },
        [ref, handler]
    )

    useEffect(() => {
        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)

        return () => {
            document.removeEventListener('mousedown', listener)
            document.removeEventListener('touchstart', listener)
        }
    }, [listener])
}
