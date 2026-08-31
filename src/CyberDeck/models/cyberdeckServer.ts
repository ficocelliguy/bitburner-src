import {
  AddToAllServers,
  connectServers,
  createUniqueRandomIp,
  GetServer,
  GetServerOrThrow,
} from "../../Server/AllServers";
import { SpecialServers } from "../../Server/data/SpecialServers";
import { Server } from "../../Server/Server";
import { CyberdeckEvents, CyberdeckState } from "./CyberdeckState";
import { ComponentCounts } from "../Types";
import { Player } from "@player";

export function addCyberdeckServer() {
  if (GetServer(SpecialServers.Cyberdeck)) {
    return;
  }
  const server = new Server({
    hackDifficulty: 0,
    hostname: SpecialServers.Cyberdeck,
    ip: createUniqueRandomIp(),
    isConnectedTo: false,
    maxRam: 4 + CyberdeckState.serverRamUpgrades,
    moneyAvailable: 0,
    numOpenPortsRequired: 0,
    organizationName: "Hosaka",
    purchasedByPlayer: true,
    requiredHackingSkill: 0,
    serverGrowth: 0,
    adminRights: true,
  });
  server.backdoorInstalled = true;
  server.cpuCores = CyberdeckState.serverCoreUpgrades;

  AddToAllServers(server);
  connectServers(GetServerOrThrow(SpecialServers.Cyberdeck), GetServerOrThrow(SpecialServers.Home));
}

export function getCyberdeckServerRamUpgradeCap() {
  return 28; // TODO-fico: make this a SF reward or something
}

export function canUpgradeCyberdeckServerRam() {
  return CyberdeckState.serverRamUpgrades < getCyberdeckServerRamUpgradeCap();
}

export function getCyberdeckServerRamUpgradeCost() {
  if (!canUpgradeCyberdeckServerRam()) {
    return {
      componentCost: { ROM: Infinity, neurodes: Infinity, chips: Infinity, cores: 0, ICE: 0 },
      moneyCost: Infinity,
    };
  }
  const componentCost: ComponentCounts = {
    ROM: 25 * (CyberdeckState.serverRamUpgrades + 1),
    neurodes: 25 * (CyberdeckState.serverRamUpgrades + 1),
    chips: 25 * (CyberdeckState.serverRamUpgrades + 1),
    cores: 0,
    ICE: 0,
  };
  const moneyCost = 2e6 * 2 ** (CyberdeckState.serverRamUpgrades + 1);
  return { componentCost, moneyCost };
}

export function canAffordCyberdeckServerRamUpgrade() {
  const { componentCost, moneyCost } = getCyberdeckServerRamUpgradeCost();
  const hasComponents = Object.entries(componentCost).every(([component, count]) => {
    return CyberdeckState.components[component as keyof ComponentCounts] >= count;
  });
  const hasMoney = Player.money >= moneyCost;
  return hasComponents && hasMoney;
}

export function upgradeCyberdeckServerRam() {
  if (!canAffordCyberdeckServerRamUpgrade()) {
    return false;
  }
  const { componentCost, moneyCost } = getCyberdeckServerRamUpgradeCost();
  Object.entries(componentCost).forEach(([component, count]) => {
    CyberdeckState.components[component as keyof ComponentCounts] -= count;
  });
  Player.loseMoney(moneyCost, "cyberdeck");
  CyberdeckState.serverRamUpgrades++;
  const server = GetServerOrThrow(SpecialServers.Cyberdeck);
  server.maxRam = 4 + CyberdeckState.serverRamUpgrades;

  CyberdeckEvents.emit();
  return true;
}

export function getCyberdeckServerCoreUpgradeCost() {
  const componentCost: ComponentCounts = {
    ROM: 20 * (CyberdeckState.serverCoreUpgrades + 1),
    neurodes: 20 * (CyberdeckState.serverCoreUpgrades + 1),
    chips: 20 * (CyberdeckState.serverCoreUpgrades + 1),
    cores: 0,
    ICE: 0,
  };
  const moneyCost = 1e6 * 1.8 ** (CyberdeckState.serverCoreUpgrades + 1);
  return { componentCost, moneyCost };
}

export function canAffordCyberdeckServerCoreUpgrade() {
  const { componentCost, moneyCost } = getCyberdeckServerCoreUpgradeCost();
  const hasComponents = Object.entries(componentCost).every(([component, count]) => {
    return CyberdeckState.components[component as keyof ComponentCounts] >= count;
  });
  const hasMoney = Player.money >= moneyCost;
  return hasComponents && hasMoney;
}

export function upgradeCyberdeckServerCores() {
  if (!canAffordCyberdeckServerCoreUpgrade()) {
    return false;
  }
  const { componentCost, moneyCost } = getCyberdeckServerCoreUpgradeCost();
  Object.entries(componentCost).forEach(([component, count]) => {
    CyberdeckState.components[component as keyof ComponentCounts] -= count;
  });
  Player.loseMoney(moneyCost, "cyberdeck");
  CyberdeckState.serverCoreUpgrades++;
  const server = GetServerOrThrow(SpecialServers.Cyberdeck);
  server.cpuCores = CyberdeckState.serverCoreUpgrades;

  CyberdeckEvents.emit();
  return true;
}
