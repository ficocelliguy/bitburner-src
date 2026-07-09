import { CyberDeckState, Socket, socketColors } from "../models/CyberDeckState";
import { getSocketId } from "../models/moduleRack";


export function DrawWiresOnCanvas(canvas: HTMLCanvasElement | null, startingSocket: Socket | null = null, mouseLocation: {x: number, y: number} | null = null) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const canvasLocation = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const startingLocation = document.getElementById(getSocketId(startingSocket))?.getBoundingClientRect();
  if (startingSocket && startingLocation && mouseLocation) {
    const startX = startingLocation.x + startingLocation.width / 2 - canvasLocation.x;
    const startY = startingLocation.y + startingLocation.height / 2 - canvasLocation.y;

    ctx.strokeStyle = socketColors[startingSocket.socketIndex];
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(mouseLocation.x - canvasLocation.x, mouseLocation.y - canvasLocation.y);
    ctx.stroke();
  }

  for (const connection of CyberDeckState.connections) {
    const [source, destination] = connection;
    const sourceLocation = document.getElementById(getSocketId(source))?.getBoundingClientRect();
    const destinationLocation = document.getElementById(getSocketId(destination))?.getBoundingClientRect();
    if (!sourceLocation ||  !destinationLocation) {
      console.error(`Could not find source or destination location for connection: ${getSocketId(source)} -> ${getSocketId(destination)}`);
      continue;
    }
    const startX = sourceLocation.x + sourceLocation.width / 2 - canvasLocation.x;
    const startY = sourceLocation.y + sourceLocation.height / 2 - canvasLocation.y;
    const endX = destinationLocation.x + destinationLocation.width / 2 - canvasLocation.x;
    const endY = destinationLocation.y + destinationLocation.height / 2 - canvasLocation.y;

    ctx.strokeStyle = socketColors[source.socketIndex];
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}
