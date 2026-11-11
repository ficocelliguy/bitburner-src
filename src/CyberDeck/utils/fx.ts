import { Settings } from "../../Settings/Settings";
import { EventEmitter } from "../../utils/EventEmitter";

const SPARK_COUNT = 16;

interface Spark {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
}

interface PopupText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: string;
}

let nextFxId = 0;
export let activeSparks: Spark[] = [];
export let activePopupTexts: PopupText[] = [];

/** Event emitter to allow the FX layer to rerender when effects are added or finish animating */
export const FxEvents = new EventEmitter<[]>();

export function removeSpark(id: number) {
  activeSparks = activeSparks.filter((spark) => spark.id !== id);
  FxEvents.emit();
}

export function removePopupText(id: number) {
  activePopupTexts = activePopupTexts.filter((popupText) => popupText.id !== id);
  FxEvents.emit();
}

function getRandomHexColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}

export function createSparkles(x: number, y: number, color: string = "") {
  for (let i = 0; i < SPARK_COUNT; i++) {
    activeSparks.push({
      id: nextFxId++,
      x,
      y,
      tx: (Math.random() - 0.5) * 800,
      ty: (Math.random() - 0.5) * 800,
      color: color || getRandomHexColor(),
    });
  }
  FxEvents.emit();
}

export interface PopupTextOptions {
  color?: string;
  fontSize?: string;
  /** Random positional jitter in px, applied as +/- half the value on each axis */
  jitterX?: number;
  jitterY?: number;
}

/** Spawns text centered at the given viewport coordinates that pops up, floats upward, and fades out. */
export function createPopupText(x: number, y: number, text: string, options: PopupTextOptions = {}) {
  const { color = Settings.theme.primary, fontSize = "20px", jitterX = 40, jitterY = 20 } = options;
  activePopupTexts.push({
    id: nextFxId++,
    x: x + (Math.random() - 0.5) * jitterX,
    y: y + (Math.random() - 0.5) * jitterY,
    text,
    color,
    fontSize,
  });
  FxEvents.emit();
}
