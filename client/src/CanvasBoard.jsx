// src/CanvasBoard.jsx
import React, { useEffect, useRef, useState } from 'react';
import { socket } from './socket';

function CanvasBoard({ isDrawer = false }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(4);

  // Setup canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fill its container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctxRef.current = ctx;
  }, []);

  // Stop any local drawing if the role changes
  useEffect(() => {
    if (!isDrawer) {
      setIsDrawing(false);
      setLastPos(null);
    }
  }, [isDrawer]);

  // Socket listeners
  useEffect(() => {
    const handleInitStrokes = (strokes) => {
      strokes.forEach((s) => drawLine(s));
    };

    const handleDraw = (data) => {
      drawLine(data);
    };

    const handleClear = () => {
      clearCanvas();
    };

    socket.on('init_strokes', handleInitStrokes);
    socket.on('draw', handleDraw);
    socket.on('clear', handleClear);

    return () => {
      socket.off('init_strokes', handleInitStrokes);
      socket.off('draw', handleDraw);
      socket.off('clear', handleClear);
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    if (!isDrawer) return;
    const pos = getCanvasCoords(e);
    setLastPos(pos);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawer) return;
    if (!isDrawing || !lastPos) return;
    const newPos = getCanvasCoords(e);

    const stroke = {
      fromX: lastPos.x,
      fromY: lastPos.y,
      toX: newPos.x,
      toY: newPos.y,
      color,
      size,
    };

    drawLine(stroke);
    socket.emit('draw', stroke);

    setLastPos(newPos);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  const drawLine = (data) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const { fromX, fromY, toX, toY, color, size } = data;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.closePath();
  };

  const handleClearClick = () => {
    if (!isDrawer) return;
    clearCanvas();
    socket.emit('clear');
  };

  return (
    <div className="w-full max-w-4xl flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-slate-800/80 rounded-lg px-4 py-2 border border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Color
          </span>
          <input
            type="color"
            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={!isDrawer}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Size
          </span>
          <input
            type="range"
            min="1"
            max="30"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-32 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isDrawer}
          />
          <span className="text-xs text-slate-300">{size}px</span>
        </div>

        <button
          className="ml-auto px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-xs font-semibold uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleClearClick}
          disabled={!isDrawer}
        >
          Clear Board
        </button>
      </div>

      {/* Canvas */}
      <div className="w-full aspect-[16/10] bg-white rounded-lg overflow-hidden border border-slate-700 shadow-inner">
        <canvas
          ref={canvasRef}
          className={`w-full h-full block ${
            isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
}

export default CanvasBoard;
