import { CyberdeckState } from "../models/CyberdeckState";
import { getSocketId } from "../utils/moduleUtilities";
import { Socket } from "../Types";
import { getSocketColor } from "../models/constants";

const mostRecentMouseLocation = { x: 0, y: 0 };

export function DrawWiresOnCanvas(
  canvas: HTMLCanvasElement | null,
  startingSocket: Socket | null = null,
  mouseLocation: { x: number; y: number } | null = null,
) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const canvasLocation = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const startingLocation = document.getElementById(getSocketId(startingSocket))?.getBoundingClientRect();
  if (mouseLocation) {
    mostRecentMouseLocation.x = mouseLocation.x;
    mostRecentMouseLocation.y = mouseLocation.y;
  }
  if (startingSocket && startingLocation) {
    const startX = startingLocation.x + startingLocation.width / 2 - canvasLocation.x;
    const startY = startingLocation.y + startingLocation.height / 2 - canvasLocation.y;

    drawLine(
      startingSocket.socketIndex,
      ctx,
      startX,
      startY,
      mostRecentMouseLocation.x - canvasLocation.x,
      mostRecentMouseLocation.y - canvasLocation.y,
    );
  }

  for (const connection of CyberdeckState.connections) {
    const [source, destination] = connection;
    const sourceLocation = document.getElementById(getSocketId(source))?.getBoundingClientRect();
    const destinationLocation = document.getElementById(getSocketId(destination))?.getBoundingClientRect();
    if (!sourceLocation || !destinationLocation) {
      console.error(
        `Could not find source or destination location for connection: ${getSocketId(source)} -> ${getSocketId(
          destination,
        )}`,
      );
      continue;
    }
    const startX = sourceLocation.x + sourceLocation.width / 2 - canvasLocation.x;
    const startY = sourceLocation.y + sourceLocation.height / 2 - canvasLocation.y;
    const endX = destinationLocation.x + destinationLocation.width / 2 - canvasLocation.x;
    const endY = destinationLocation.y + destinationLocation.height / 2 - canvasLocation.y;

    drawLine(source.socketIndex, ctx, startX, startY, endX, endY);
  }
}

function drawLine(
  socketIndex: number,
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  ctx.strokeStyle = getSocketColor(socketIndex);
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}
