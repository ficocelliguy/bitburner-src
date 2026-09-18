import { NETRUNNING_HEIGHT, NETRUNNING_WIDTH, NetrunningState } from "./NetrunningState";
import { CyberdeckEvents, CyberdeckState } from "./CyberdeckState";
import _ from "lodash";
import { clampNumber } from "../../utils/helpers/clampNumber";
import { Settings } from "../../Settings/Settings";
import { createSparkles } from "../utils/fx";
import { NetrunEntity } from "../Types";
import { NetrunDirection, NetrunEntityVariant } from "../Enums";
import { Player } from "@player";
import { Page } from "../../ui/Router";
import { Router } from "../../ui/GameRoot";

export function move(direction: NetrunDirection, programmaticMove: boolean = false) {
  spreadOfflineNodes();

  const [y, x] = NetrunningState.location;
  const dx = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const dy = direction === "up" ? -1 : direction === "down" ? 1 : 0;
  const newLocation = NetrunningState.grid[y + dy]?.[x + dx];
  if (!newLocation) {
    return false;
  }
  if (newLocation.type == NetrunEntityVariant.offline) {
    hitOfflineNode(programmaticMove);
  } else if (newLocation.type === NetrunEntityVariant.empty) {
    NetrunningState.location = [y + dy, x + dx];
    updateCurrentThreatSignalStrength();
  } else if (newLocation.type === NetrunEntityVariant.dataStore) {
    breakEntity(newLocation);
    consumeEnergy(energyCost() * 0.3);
    const groupSizeFactor = (NetrunningState.groups[newLocation.group]?.length ?? 5) * 0.5;
    NetrunningState.rewardScore += getIceReward(newLocation) * groupSizeFactor;
  } else if (NetrunningState.energy <= 0) {
    shakePowerIndicator();
    return false;
  } else if (newLocation.flagged && newLocation.hits === 0) {
    return false;
  } else if (newLocation.hasBomb) {
    detonateBomb(newLocation);
  } else if (newLocation.type === NetrunEntityVariant.ice) {
    breakEntity(newLocation);
    consumeEnergy(energyCost());
    NetrunningState.rewardScore += getIceReward(newLocation);
  } else if (newLocation.type === NetrunEntityVariant.firewall) {
    newLocation.hits++;
    consumeEnergy(energyCost());
    if (newLocation.hits >= 3) {
      breakEntity(newLocation);
    }
  }

  CyberdeckEvents.emit();
  return true;
}

function hitOfflineNode(programmaticMove: boolean) {
  shakeGrid();
  const [y, x] = NetrunningState.location;
  const entity = NetrunningState.grid[y]?.[x];
  emitSparklesOnEntity(entity);
  emitSparklesOnEntity(entity);
  emitSparklesOnEntity(entity);
  NetrunningState.rewardScore = 0;
  NetrunningState.energy = 0;

  setTimeout(() => {
    NetrunningState.isNetrunning = false;
    Player.hospitalize(programmaticMove);
    Router.toPage(Page.City);
  }, 500);
}

function getIceReward(entity: NetrunEntity) {
  const entityDepth = (entity.x / NETRUNNING_WIDTH + entity.y / NETRUNNING_HEIGHT) * 0.6 + 0.2;
  return 8 * entityDepth;
}

function energyCost() {
  return Math.max(0.1 - CyberdeckState.netrunningLevel * 0.002, 0.03);
}

function consumeEnergy(amount: number) {
  NetrunningState.energy = Math.max(NetrunningState.energy - amount, 0);
  if (!NetrunningState.energy) {
    resetThreatLevels();
  }
}

export function getEmptyGrid(width: number, height: number): NetrunEntity[][] {
  const grid: NetrunEntity[][] = [];
  for (let y = 0; y < height; y++) {
    const row: NetrunEntity[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        type: NetrunEntityVariant.empty,
        group: 0,
        hits: 0,
        threat: 0,
        hasBomb: false,
        flagged: false,
        visible: false,
        x,
        y,
      });
    }
    grid.push(row);
  }
  return grid;
}

export function initNetrunGrid(corrupted: boolean) {
  NetrunningState.grid = getEmptyGrid(NETRUNNING_WIDTH, NETRUNNING_HEIGHT);
  NetrunningState.location = [0, 0];
  NetrunningState.groups = {};
  NetrunningState.isNetrunning = true;
  NetrunningState.corrupted = corrupted;
  NetrunningState.shaking = false;
  NetrunningState.rewardScore = 0;
  NetrunningState.energy = 1;
  NetrunningState.steps = 0;

  // Add firewalls
  const firewallCount = Math.random() * 3 + 5;
  for (let i = 0; i < firewallCount; i++) {
    const size = Math.floor(Math.random() * 4) + 3;
    let x = Math.floor(Math.random() * NETRUNNING_WIDTH * 0.7);
    let y = Math.floor(Math.random() * NETRUNNING_HEIGHT * 0.7);
    for (let j = 0; j < size; j++) {
      if (Math.random() < 0.5) {
        x++;
      } else {
        y++;
      }
      if (!NetrunningState.grid[y]?.[x]) {
        break;
      }
      NetrunningState.grid[y][x].type = NetrunEntityVariant.firewall;
    }
  }

  // Fill with ICE
  for (let y = 0; y < NETRUNNING_HEIGHT; y++) {
    for (let x = 0; x < NETRUNNING_WIDTH; x++) {
      if (NetrunningState.grid[y][x].type === NetrunEntityVariant.empty && Math.random() < 0.9) {
        NetrunningState.grid[y][x].type = NetrunEntityVariant.ice;
      }
    }
  }

  // cluster contiguous entities into groups
  let groupId = 0;
  for (let y = 0; y < NETRUNNING_HEIGHT; y++) {
    for (let x = 0; x < NETRUNNING_WIDTH; x++) {
      const baseEntity = NetrunningState.grid[y][x];
      const type = baseEntity.type;
      if (baseEntity.group) {
        continue;
      }
      groupId++;
      const stack: [number, number][] = [[x, y]];
      while (stack.length && ((NetrunningState.groups[groupId]?.length ?? 0) < 7 || type !== NetrunEntityVariant.ice)) {
        const [cx, cy] = stack.pop() ?? [-1, -1];
        const entity = NetrunningState.grid[cy]?.[cx];
        if (
          !entity ||
          entity.type !== type ||
          entity.group ||
          (type === NetrunEntityVariant.ice && NetrunningState.groups[groupId]?.length > 3 && Math.random() < 0.3)
        ) {
          continue;
        }

        NetrunningState.grid[cy][cx].group = groupId;
        NetrunningState.groups[groupId] ??= [];
        NetrunningState.groups[groupId].push(NetrunningState.grid[cy][cx]);
        stack.push([cx + 1, cy]);
        stack.push([cx - 1, cy]);
        stack.push([cx, cy + 1]);
        stack.push([cx, cy - 1]);
      }
    }
  }

  // Convert tiny ice groups into empty space
  for (const group of Object.values(NetrunningState.groups)) {
    const id = group[0].group;
    if (id && group.length < 3 && group[0].type === NetrunEntityVariant.ice) {
      for (const entity of group) {
        entity.type = NetrunEntityVariant.empty;
      }
    }
  }

  // Make airspace at the start
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      breakEntity(NetrunningState.grid[y][x]);
    }
  }

  // Plant bombs
  const bombCount = Math.random() * 2 + 4;
  for (let i = 0; i < bombCount; i++) {
    const iceGroup = _.shuffle(
      Object.values(NetrunningState.groups).filter((g) => g[0]?.type === NetrunEntityVariant.ice && !g[0]?.hasBomb),
    )[0];
    if (!iceGroup) {
      break;
    }
    for (const member of iceGroup) {
      member.hasBomb = true;
    }
  }

  // Convert some ice groups to reward groups
  const rewardCount = 5;
  for (let i = 0; i < rewardCount; i++) {
    const iceGroup = _.shuffle(
      Object.values(NetrunningState.groups).filter(
        (g) =>
          g[0]?.type === NetrunEntityVariant.ice &&
          !g[0]?.hasBomb &&
          (g[0]?.x > 8 || g[0]?.y > 8) &&
          hasNoRewardGroupNeighbor(g),
      ),
    )[0];
    if (!iceGroup) {
      break;
    }
    for (const member of iceGroup) {
      member.type = NetrunEntityVariant.dataStore;
    }
  }

  // Seed offline node for corrupted netrun
  if (corrupted) {
    const coinflip = Math.random() < 0.5;
    const x = coinflip ? 0 : NETRUNNING_WIDTH - 1;
    const y = coinflip ? NETRUNNING_HEIGHT - 1 : 0;
    offlineEntity(NetrunningState.grid[y][x]);
  }

  updateCurrentThreatSignalStrength();
  CyberdeckEvents.emit();
}

function hasNoRewardGroupNeighbor(group: NetrunEntity[]) {
  for (const member of group) {
    for (const neighbor of getNeighbors(member)) {
      if (neighbor?.type === NetrunEntityVariant.dataStore && neighbor.group !== member.group) {
        return false;
      }
    }
  }
  return true;
}

function offlineEntity(entity: NetrunEntity | null) {
  if (!entity || entity.type === NetrunEntityVariant.offline) {
    return;
  }
  const [y, x] = NetrunningState.location;
  if (entity.x == x && entity.y == y) {
    return offlineEntity(NetrunningState.grid[y + 1]?.[x + 1]);
  }
  entity.type = NetrunEntityVariant.offline;
  entity.group = -1;
  NetrunningState.groups[-1] ??= [];
  NetrunningState.groups[-1].unshift(entity);
}

function spreadOfflineNodes() {
  NetrunningState.steps++;

  if (NetrunningState.steps % 3 !== 0) {
    return;
  }

  const offlineNodes = NetrunningState.groups[-1]?.slice(0) ?? [];

  for (const [index, entity] of offlineNodes.entries()) {
    if (Math.random() < 0.6 && index > 4) {
      continue;
    }
    const neighbors = getNeighbors(entity).filter((n) => n);
    const spreadLocationPrime = neighbors[Math.floor(Math.random() * neighbors.length)];
    const spreadLocationNeighbors = getNeighbors(spreadLocationPrime).filter(
      (n) => n && n.type !== NetrunEntityVariant.offline,
    );
    const finalSpreadLocation = spreadLocationNeighbors[Math.floor(Math.random() * spreadLocationNeighbors.length)];
    offlineEntity(spreadLocationPrime);

    offlineEntity(finalSpreadLocation);
  }
}

function getNeighbors(entity: NetrunEntity) {
  return [
    NetrunningState.grid[entity.y - 1]?.[entity.x],
    NetrunningState.grid[entity.y + 1]?.[entity.x],
    NetrunningState.grid[entity.y]?.[entity.x - 1],
    NetrunningState.grid[entity.y]?.[entity.x + 1],
  ];
}

function breakEntity(entity: NetrunEntity) {
  emitSparklesOnEntity(entity);

  const group = NetrunningState.groups[entity.group] ?? [];
  const originalType = entity.type;
  entity.type = NetrunEntityVariant.empty;
  revealGroup(entity);
  if (originalType === NetrunEntityVariant.firewall) {
    return;
  }
  for (const member of group) {
    member.type = NetrunEntityVariant.empty;
    for (const neighbor of getNeighbors(member)) {
      revealGroup(neighbor);
    }
  }
}

function revealGroup(entity: NetrunEntity | undefined) {
  if (!entity) return;
  entity.visible = true;
  const group = NetrunningState.groups[entity.group] ?? [];
  for (const member of group) {
    member.visible = true;
  }
  if (entity.type !== NetrunEntityVariant.empty) return;

  for (const entity of group) {
    for (const neighbor of getNeighbors(entity)) {
      if (neighbor && neighbor.group !== entity.group && !neighbor.visible) {
        revealGroup(neighbor);
      }
    }
  }
}

function detonateBomb(entity: NetrunEntity) {
  if (entity.hits >= 2) {
    breakEntity(entity);
    return;
  }
  const group = NetrunningState.groups[entity.group] ?? [];
  for (const entity of group) {
    entity.hits++;
  }
  revealGroup(entity);

  if (entity.hits > 1) {
    return;
  }

  consumeEnergy(entity.hits === 1 ? 0.3 : energyCost() * 0.6);
  shakeGrid();
  resetThreatLevels();
  updateCurrentThreatSignalStrength();
  emitSparklesOnEntity(entity);
}

function resetThreatLevels() {
  for (let y = 0; y < NETRUNNING_HEIGHT; y++) {
    for (let x = 0; x < NETRUNNING_WIDTH; x++) {
      NetrunningState.grid[y][x].threat = 0;
    }
  }
}

export function getThreatSignalStrength() {
  if (!NetrunningState.energy) {
    return { threat: 0, signals: 0 };
  }
  const bombGroups = Object.values(NetrunningState.groups).filter(
    (g) => g[0]?.type === NetrunEntityVariant.ice && g[0]?.hasBomb && !g[0]?.hits,
  );
  let threat = 0;
  let signals = 0;
  for (const group of bombGroups) {
    const distance = getDistanceToGroup(group);
    threat += Math.max(6 - distance, 0) / 6;
    signals += distance < 6 ? 1 : 0;
  }

  return { threat, signals };
}

function updateCurrentThreatSignalStrength() {
  const [y, x] = NetrunningState.location;
  NetrunningState.grid[y][x].threat = getThreatSignalStrength().threat;
}

function getDistanceToGroup(group: NetrunEntity[]): number {
  return group.reduce((distance, member) => {
    const [y, x] = NetrunningState.location;
    const memberDistance = Math.sqrt((x - member.x) ** 2 + (y - member.y) ** 2) - 1;
    return Math.min(memberDistance, distance);
  }, 999);
}

function interpolateColor(color1: number[], color2: number[], factor: number, opacity: number) {
  const r = Math.round(color1[0] + factor * (color2[0] - color1[0]));
  const g = Math.round(color1[1] + factor * (color2[1] - color1[1]));
  const b = Math.round(color1[2] + factor * (color2[2] - color1[2]));
  return `rgba(${r},${g},${b},${opacity})`;
}

export function getThreatColor(threatRating: number) {
  if (threatRating === 0) {
    return "";
  }
  // Clamp threat between 0 and 1.5
  const threat = clampNumber(threatRating, 0, 1.5);
  // Define RGB anchors: Green -> Red -> Purple
  const green = [0, 128, 0];
  const red = [255, 0, 0];
  const purple = [255, 0, 128];

  if (threat < 1) {
    // First half: Green to Red
    const opacity = clampNumber(threat * 3, 0.4, 1);
    return interpolateColor(green, red, threat ** 3, opacity);
  } else {
    // Second half: Red to Purple
    return interpolateColor(red, purple, (threat - 1) * 2, 1);
  }
}

export function getEntityColor(entity: NetrunEntity) {
  const theme = Settings.theme;
  if (!entity.visible) {
    return theme.black;
  }
  if (entity.type === NetrunEntityVariant.offline) {
    return "transparent";
  }
  if (entity.type === NetrunEntityVariant.dataStore) {
    return Settings.theme.money;
  }
  if (entity.type === NetrunEntityVariant.ice && entity.hasBomb && entity.hits) {
    return Settings.theme.error;
  }
  if (entity.type === NetrunEntityVariant.ice) {
    const variant = entity.group % 2;
    return [theme.infolight, theme.info][variant];
  }
  if (entity.type === NetrunEntityVariant.firewall) {
    return Settings.theme.cha;
  }
  return Settings.theme.welllight;
}

function emitSparklesOnEntity(entity: NetrunEntity) {
  const element = document.getElementById(`netrun-entity-${entity.x},${entity.y}`);
  if (!element) {
    return;
  }
  const { x, y } = element.getBoundingClientRect();
  createSparkles(x + 10, y + 10, getEntityColor(entity));
}

function shakeGrid() {
  NetrunningState.shaking = true;
  void setTimeout(() => (NetrunningState.shaking = false), 700);
}

function shakePowerIndicator() {
  NetrunningState.shakingBattery = true;
  void setTimeout(() => (NetrunningState.shakingBattery = false), 700);
  CyberdeckEvents.emit();
}

export function flagEntity(entity: NetrunEntity) {
  if (!entity.visible || entity.type !== NetrunEntityVariant.ice) {
    return;
  }
  const group = NetrunningState.groups[entity.group];
  for (const member of group) {
    member.flagged = !member.flagged;
  }
  CyberdeckEvents.emit();
}

export function getSurroundings(): Record<NetrunDirection, NetrunEntityVariant> {
  const [y, x] = NetrunningState.location;
  return {
    [NetrunDirection.up]: NetrunningState.grid[y - 1]?.[x]?.type ?? null,
    [NetrunDirection.down]: NetrunningState.grid[y + 1]?.[x]?.type ?? null,
    [NetrunDirection.left]: NetrunningState.grid[y]?.[x - 1]?.type ?? null,
    [NetrunDirection.right]: NetrunningState.grid[y]?.[x + 1]?.type ?? null,
  };
}
