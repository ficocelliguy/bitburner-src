import {
  netrunEntityVariant,
  NETRUNNING_HEIGHT,
  NETRUNNING_WIDTH,
  NetrunEntity,
  NetrunningState,
  netrunDirectionType,
} from "./NetrunningState";
import { CyberdeckEvents } from "./CyberdeckState";

export function move(direction: netrunDirectionType) {
  const [x,y] = NetrunningState.location;
  const dx = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const dy = direction === "up" ? -1 : direction === "down" ? 1 : 0;
  const newLocation = NetrunningState.grid[y + dy]?.[x + dx];
  if (!newLocation) {
    console.warn("Cannot move outside of grid");
    return false;
  }
  if (newLocation.type === netrunEntityVariant.empty) {
    NetrunningState.location = [x + dx, y + dy];
  }
  else if (newLocation.type === netrunEntityVariant.ice) {
    breakEntity(newLocation);
    // TODO: bombs
  }
  else if (newLocation.type === netrunEntityVariant.firewall) {
    newLocation.hits++;
    if (newLocation.hits >= 3) {
      breakEntity(newLocation);
    }
  }

  console.log(`Moved to ${NetrunningState.location[0]}, ${NetrunningState.location[1]}`);
  CyberdeckEvents.emit();
  return true;
}

export function getEmptyGrid(width: number, height: number): NetrunEntity[][] {
  const grid: NetrunEntity[][] = [];
  for (let y = 0; y < height; y++) {
    const row: NetrunEntity[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ type: netrunEntityVariant.empty, group: 0, hits: 0, threat: 0, hasBomb: false, visible: false, x, y });
    }
    grid.push(row);
  }
  return grid;
}

export function initNetrunGrid() {
  NetrunningState.grid = getEmptyGrid(NETRUNNING_WIDTH, NETRUNNING_HEIGHT);
  NetrunningState.location = [0,0];
  NetrunningState.groups = {};

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
      NetrunningState.grid[y][x].type = netrunEntityVariant.firewall;
    }
  }

  // Fill with ICE
  for (let y = 0; y < NETRUNNING_HEIGHT; y++) {
    for (let x = 0; x < NETRUNNING_WIDTH; x++) {
      if (NetrunningState.grid[y][x].type === netrunEntityVariant.empty && Math.random() < 0.9) {
        NetrunningState.grid[y][x].type = netrunEntityVariant.ice;
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
      while (stack.length && ((NetrunningState.groups[groupId]?.length ?? 0) < 7 || type !== netrunEntityVariant.ice)) {
        const [cx, cy] = stack.pop() ?? [-1, -1];
        const entity = NetrunningState.grid[cy]?.[cx];
        if (
          !entity ||
          entity.type !== type ||
          entity.group ||
          (type === netrunEntityVariant.ice && NetrunningState.groups[groupId]?.length > 3 && Math.random() < 0.3)
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
    if (id && group.length < 3 && group[0].type === netrunEntityVariant.ice) {
      for (const entity of group) {
        entity.type = netrunEntityVariant.empty;
      }
    }
  }

  // Make airspace at the start
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      breakEntity(NetrunningState.grid[y][x]);
    }
  }

  CyberdeckEvents.emit();
}

function breakEntity(entity: NetrunEntity) {
  const group = NetrunningState.groups[entity.group];
  const originalType = entity.type;
  entity.type = netrunEntityVariant.empty;
  revealGroup(entity);
  if (originalType === netrunEntityVariant.firewall) {
    return;
  }
  for (const member of group) {
    member.type = netrunEntityVariant.empty;
    revealGroup(NetrunningState.grid[member.y - 1]?.[member.x]);
    revealGroup(NetrunningState.grid[member.y + 1]?.[member.x]);
    revealGroup(NetrunningState.grid[member.y]?.[member.x - 1]);
    revealGroup(NetrunningState.grid[member.y]?.[member.x + 1]);
  }
}

function revealGroup(entity: NetrunEntity | undefined ) {
  if (!entity) return;
  entity.visible = true;
  if (entity.group === null) return;
  const group = NetrunningState.groups[entity.group] ?? [];
  for (const member of group) {
    member.visible = true;
  }
  if (entity.type !== netrunEntityVariant.empty) return;

  for (const entity of group) {
    const neighbors = [
      NetrunningState.grid[entity.y - 1]?.[entity.x],
      NetrunningState.grid[entity.y + 1]?.[entity.x],
      NetrunningState.grid[entity.y]?.[entity.x -1],
      NetrunningState.grid[entity.y]?.[entity.x +1],
    ];
    for (const neighbor of neighbors) {
      if (
        neighbor &&
        neighbor.group !== entity.group &&
        !neighbor.visible
      ) {
        revealGroup(neighbor);
      }
    }
  }
}