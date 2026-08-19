"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

export function CursorGrid({
  children,
  className = "",
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  const frame = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const element = event.currentTarget;
    const { clientX, clientY } = event;
    frame.current = requestAnimationFrame(() => {
      const bounds = element.getBoundingClientRect();
      element.style.setProperty("--cursor-x", `${clientX - bounds.left}px`);
      element.style.setProperty("--cursor-y", `${clientY - bounds.top}px`);
      frame.current = null;
    });
  }

  return (
    <div
      className={`cursor-grid ${className}`}
      onPointerLeave={(event) => {
        event.currentTarget.style.removeProperty("--cursor-x");
        event.currentTarget.style.removeProperty("--cursor-y");
      }}
      onPointerMove={handlePointerMove}
    >
      {children}
    </div>
  );
}
