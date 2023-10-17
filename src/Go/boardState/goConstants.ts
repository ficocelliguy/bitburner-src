import { getNewBoardState } from "./boardState";

export enum playerColors {
  white = "White",
  black = "Black",
  empty = "Empty",
}

export enum validityReason {
  pointNotEmpty = "That point is already occupied by a piece",
  boardRepeated = "It is illegal to repeat prior board states",
  noSuicide = "It is illegal to cause your own pieces to be captured",
  notYourTurn = "It is not your turn to play",
  gameOver = "The game is over",
  invalid = "Invalid move",
  valid = "Valid move",
}

export enum opponents {
  none = "No AI",
  Netburners = "Netburners",
  SlumSnakes = "Slum Snakes",
  TheBlackHand = "The Black Hand",
  Daedalus = "Daedalus",
  Illuminati = "Illuminati",
}

export const opponentDetails = {
  [opponents.none]: {
    komi: 5.5,
    boardSizes: [5, 7, 9, 13],
    description: "Play both colors",
    flavorText: "",
    bonusDescription: "",
    bonusPower: 0,
  },
  [opponents.Netburners]: {
    komi: 1.5,
    boardSizes: [5, 7, 9, 13],
    description: "Easy AI",
    flavorText: "A mysterious faction with only the most tenuous control over their subnets. Concentrating mainly on their hacknet server business, IPvGO is not their main strength.",
    bonusDescription: "hacknet cost",
    bonusPower: -1.5,
  },
  [opponents.SlumSnakes]: {
    komi: 3.5,
    boardSizes: [5, 7, 9, 13],
    description: "Spread AI",
    flavorText: "A small-time street gang who began organizing crime using their subnets. They are known to use long router chains snaking across the subnet to encircle territory.",
    bonusDescription: "crime money",
    bonusPower: 1.1,
  },
  [opponents.TheBlackHand]: {
    komi: 3.5,
    boardSizes: [5, 7, 9, 13],
    description: "Aggro AI",
    flavorText: "A black-hat hacking group who uses their subnets to launch DDOS attacks. They are famous for their unrelenting aggression, surrounding and strangling any foothold their opponents try to establish.",
    bonusDescription: "hacking exp",
    bonusPower: 0.8,
  },
  [opponents.Daedalus]: {
    komi: 5.5,
    boardSizes: [5, 7, 9, 13],
    description: "Mid AI",
    flavorText: "Not much is known about this shadowy organization. They do not easily let go of subnets that they control, and are known to lease IPvGO cycles in exchange for reputation among other factions.",
    bonusDescription: "reputation gain",
    bonusPower: 0.9,
  },
  [opponents.Illuminati]: {
    komi: 7.5,
    boardSizes: [5, 7, 9, 13],
    description: "4 node handicap",
    flavorText: "A group thought to only exist in myth. Said to always have prepared defenses in their IPvGO subnets. Provoke them at your own risk.",
    bonusDescription: "grow() power",
    bonusPower: 0.6,
  },
};

export const boardSizes = [5, 7, 9, 13];

export type PlayerColor = playerColors.white | playerColors.black | playerColors.empty;

export type Board = PointState[][];

export type MoveOptions = {
  capture: Move | null;
  defendCapture: Move | null;
  eyeMove: EyeMove | null;
  eyeBlock: EyeMove | null;
  pattern: PointState | null;
  growth: Move | null;
  expansion: Move | null;
  defend: Move | null;
  surround: Move | null;
};

export type Move = {
  point: PointState;
  oldLibertyCount: number | null;
  newLibertyCount: number | null;
};

export type EyeMove = {
  point: PointState;
  createsLife: boolean;
};

export type BoardState = {
  board: Board;
  previousPlayer: PlayerColor | null;
  history: Board[];
  ai: opponents;
  passCount: number;
};

export type PointState = {
  player: PlayerColor;
  chain: number;
  liberties: (PointState | null)[] | null;
  x: number;
  y: number;
};

/**
 * "move" or "pass" or "gameOver"
 */
export enum playTypes {
  move = "move",
  pass = "pass",
  gameOver = "gameOver",
}

export type Play = {
  type: playTypes;
  x: number | string;
  y: number;
};

export type Neighbor = {
  north: PointState | null;
  east: PointState | null;
  south: PointState | null;
  west: PointState | null;
};

export type goScore = {
  White: { pieces: number; territory: number; komi: number; sum: number };
  Black: { pieces: number; territory: number; komi: number; sum: number };
};

export const columnIndexes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function getGoPlayerStartingState() {
  return {
    boardState: getNewBoardState(7),
    status: {
      [opponents.none]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
      [opponents.Netburners]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
      [opponents.SlumSnakes]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
      [opponents.TheBlackHand]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
      [opponents.Daedalus]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
      [opponents.Illuminati]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
    },
    previousGameFinalBoardState: getNewBoardState(7),
  };
}
