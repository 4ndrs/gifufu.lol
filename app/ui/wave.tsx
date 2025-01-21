"use client";

import { useEffect, useRef } from "react";

const Wave = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    const { signal } = controller;

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    let offset = 0;
    let animationFrameId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const animate = () => {
      if (!ctx || !canvas) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.moveTo(0, canvas.height);

      for (let x = 0; x <= canvas.width; x++) {
        const y = Math.sin(x * 0.01 + offset) * 50 + (canvas.height - 80);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();

      ctx.fillStyle = "#10b981";
      ctx.fill();

      offset += 0.01;
      animationFrameId = requestAnimationFrame(animate);
    };

    resize();

    window.addEventListener("resize", resize, { signal });

    animate();

    return () => {
      controller.abort();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="h-72 w-full" />;
};

export default Wave;
