import { ComponentCounts } from "../Types";

export const netrunningCooldownMs = 1000 * 20;
export const minCyclesToProcess = 20;

export const componentSymbols: { [key in keyof ComponentCounts]: string } = {
  ROM: "⛃",
  neurodes: "⌬",
  chips: "⌨ ",
  cores: "⛯",
  ICE: "❅",
};

export const ICEbreakerCraftingCost: ComponentCounts = {
  ROM: 20,
  neurodes: 20,
  chips: 20,
  cores: 0,
  ICE: 0,
};

export const powerSupplyCraftingCost: ComponentCounts = {
  ROM: 10,
  neurodes: 0,
  chips: 20,
  cores: 1,
  ICE: 0,
};

export const processingModuleCraftingCost: ComponentCounts = {
  ROM: 20,
  neurodes: 0,
  chips: 10,
  cores: 1,
  ICE: 0,
};

export const uplinkCraftingCost: ComponentCounts = {
  ROM: 10,
  neurodes: 20,
  chips: 0,
  cores: 1,
  ICE: 0,
};
