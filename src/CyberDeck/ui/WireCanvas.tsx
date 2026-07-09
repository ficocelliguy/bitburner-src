

export function DrawWiresOnCanvas(canvas: HTMLCanvasElement | null, startingSocket: string, mouseLocation: {x: number, y: number}) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const canvasLocation = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const startingLocation = document.getElementById(startingSocket)?.getBoundingClientRect();
  if (!startingLocation) return;
  const startX = startingLocation.x + startingLocation.width / 2  - canvasLocation.x;
  const startY = startingLocation.y + startingLocation.height / 2 - canvasLocation.y;

  ctx.strokeStyle = "red";
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(mouseLocation.x - canvasLocation.x, mouseLocation.y - canvasLocation.y);
  ctx.stroke(); // Draw it
}
