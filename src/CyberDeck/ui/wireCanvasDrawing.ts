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

    drawLine(startingSocket.socketIndex, ctx, startX, startY, mouseLocation.x - canvasLocation.x, mouseLocation.y - canvasLocation.y);
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

    drawLine(source.socketIndex, ctx, startX, startY, endX, endY);
  }
}

function drawLine(socketIndex: number, ctx:CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number) {
  ctx.strokeStyle = socketColors[socketIndex];
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();


  // Future: 3d look with multiple lines?
  // const slope = (endY - startY) / (endX - startX);
  // const orthogonalSlope = -1/slope;
  // const deltaX = (1/Math.sqrt(1 + orthogonalSlope**2)) * 5;
  // const deltaY = (orthogonalSlope / Math.sqrt(1 + orthogonalSlope ** 2)) * 5;
  //
  // ctx.strokeStyle = darkenHex(socketColors[socketIndex], 40);
  // ctx.lineWidth = 8;
  // ctx.beginPath();
  // ctx.moveTo(startX + deltaX, startY + deltaY);
  // ctx.lineTo(endX + deltaX, endY + deltaY);
  // ctx.stroke();
}


function darkenHex(hexColor: string, percent: number) {
  // Strip the # if present
  const hex = hexColor.replace(/^#/, "");

  // Parse r, g, b values
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Calculate reduction factor (e.g., 20% means multiplying by 0.8)
  const factor = 1 - percent / 100;

  // Decrease channels and ensure they don't drop below 0
  r = Math.max(0, Math.floor(r * factor));
  g = Math.max(0, Math.floor(g * factor));
  b = Math.max(0, Math.floor(b * factor));

  // Convert back to hex and pad with leading zeros if necessary
  const toHex = (val: number) => val.toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
