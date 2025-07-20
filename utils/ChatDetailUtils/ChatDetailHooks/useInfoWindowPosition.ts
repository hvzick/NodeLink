import { useEffect } from "react";

export function useInfoWindowPosition(infoMessage: any, infoWindowPosition: { setValue: (pos: { x: number; y: number }) => void }) {
  useEffect(() => {
    if (infoMessage) {
      infoWindowPosition.setValue({ x: 20, y: 80 });
    }
  }, [infoMessage, infoWindowPosition]);
} 