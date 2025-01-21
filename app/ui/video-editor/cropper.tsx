import {
  RxCornerTopLeft,
  RxCornerTopRight,
  RxCornerBottomLeft,
  RxCornerBottomRight,
} from "react-icons/rx";

import { useRef } from "react";

type Props = {
  size: { width: number; height: number };
  position: { top: number; left: number };
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onSizeChange: (size: { width: number; height: number }) => void;
  onPositionChange: (position: { top: number; left: number }) => void;
};

const Cropper = ({
  size,
  position,
  videoRef,
  onSizeChange,
  onPositionChange,
}: Props) => {
  const initialMousePositionRef = useRef({ x: 0, y: 0 });

  const handleMoveStart = (event: React.PointerEvent) => {
    event.preventDefault();

    initialMousePositionRef.current = { x: event.clientX, y: event.clientY };

    const controller = new AbortController();

    const { signal } = controller;

    document.addEventListener(
      "pointermove",
      (event) => {
        if (!videoRef.current) {
          return;
        }

        const videoRect = videoRef.current.getBoundingClientRect();

        let top =
          position.top + event.clientY - initialMousePositionRef.current.y;

        let left =
          position.left + event.clientX - initialMousePositionRef.current.x;

        top = Math.max(0, Math.min(videoRect.height - size.height, top));
        left = Math.max(0, Math.min(videoRect.width - size.width, left));

        onPositionChange({ top, left });
      },
      { signal },
    );

    document.addEventListener("pointerup", () => controller.abort(), {
      signal,
    });
  };

  const handleResizeStart = (
    event: React.PointerEvent,
    corner: "top-left" | "top-right" | "bottom-left" | "bottom-right",
  ) => {
    event.preventDefault();

    initialMousePositionRef.current = { x: event.clientX, y: event.clientY };

    const initialSize = { ...size };
    const initialPosition = { ...position };

    const controller = new AbortController();

    const { signal } = controller;

    document.addEventListener(
      "pointermove",
      (event) => {
        if (!videoRef.current) {
          return;
        }

        const videoRect = videoRef.current.getBoundingClientRect();

        const deltaX = event.clientX - initialMousePositionRef.current.x;
        const deltaY = event.clientY - initialMousePositionRef.current.y;

        let top = initialPosition.top;
        let left = initialPosition.left;

        let width = initialSize.width;
        let height = initialSize.height;

        const minimumSize = 32;

        switch (corner) {
          case "top-left":
            top = initialPosition.top + deltaY;
            left = initialPosition.left + deltaX;
            width = Math.max(minimumSize, initialSize.width - deltaX);
            height = Math.max(minimumSize, initialSize.height - deltaY);

            if (left < 0 || top < 0) {
              return;
            }

            break;

          case "top-right":
            top = initialPosition.top + deltaY;
            width = Math.max(minimumSize, initialSize.width + deltaX);
            height = Math.max(minimumSize, initialSize.height - deltaY);

            if (top < 0) {
              return;
            }

            break;

          case "bottom-left":
            left = initialPosition.left + deltaX;
            width = Math.max(minimumSize, initialSize.width - deltaX);
            height = Math.max(minimumSize, initialSize.height + deltaY);

            if (left < 0) {
              return;
            }

            break;

          case "bottom-right":
            width = Math.max(minimumSize, initialSize.width + deltaX);
            height = Math.max(minimumSize, initialSize.height + deltaY);

            break;
        }

        width = Math.min(width, videoRect.width - left);
        height = Math.min(height, videoRect.height - top);

        onSizeChange({ width, height });
        onPositionChange({ top, left });
      },
      { signal },
    );

    document.addEventListener("pointerup", () => controller.abort(), {
      signal,
    });
  };

  return (
    <div
      style={{ ...position, ...size }}
      className="absolute size-24 rounded-md border-white text-emerald-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
    >
      {/* moving area */}
      <div className="absolute inset-2" onPointerDown={handleMoveStart} />

      {/* sizing corners */}
      <div
        className="absolute -left-2 -top-2"
        onPointerDown={(event) => handleResizeStart(event, "top-left")}
      >
        <RxCornerTopLeft size={32} />
      </div>

      <div
        className="absolute -right-2 -top-2"
        onPointerDown={(event) => handleResizeStart(event, "top-right")}
      >
        <RxCornerTopRight size={32} />
      </div>

      <div
        className="absolute -bottom-2 -left-2"
        onPointerDown={(event) => handleResizeStart(event, "bottom-left")}
      >
        <RxCornerBottomLeft size={32} />
      </div>

      <div
        className="absolute -bottom-2 -right-2"
        onPointerDown={(event) => handleResizeStart(event, "bottom-right")}
      >
        <RxCornerBottomRight size={32} />
      </div>
    </div>
  );
};

export default Cropper;
