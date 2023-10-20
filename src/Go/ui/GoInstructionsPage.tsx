import React from "react";

import Typography from "@mui/material/Typography";
import { boardStyles } from "../boardState/goStyles";
import { Grid, Link } from "@mui/material";
import { GoGameboard } from "./GoGameboard";
import { getBoardFromSimplifiedBoardState } from "../boardAnalysis/boardAnalysis";
import { opponents, playerColors } from "../boardState/goConstants";

export const GoInstructionsPage = (): React.ReactElement => {
  const classes = boardStyles();
  return (
    <div className={classes.instructionScroller}>
      <>
        <Typography variant="h4">IPvGO</Typography>
        <br />
        <Typography>
          In late 2070, the .org bubble burst, and most of the newly-implemented IPvGO 'net collapsed overnight. Since
          then, various factions have been fighting over small subnets to control their computational power. These
          subnets are very valuable in the right hands, if you can wrest them from their current owners.
        </Typography>
        <br />
        <br />
        <Grid container columns={2}>
          <Grid item className={classes.instructionsBlurb}>
            <Typography variant="h5">How to take over IPvGO Subnets</Typography>
            <br />
            <Typography>
              Your goal is to control more territory in the subnet than the faction currently holding it.
              <br />
              <br />
              Each turn, you may place a router on an open node in the subnet, or pass. The router will connect to your
              adjacent routers, forming networks. A network's open ports to adjacent open nodes are indicated with lines
              extending outside the network.
              <br />
              <br />
              If a group of routers no longer has any open ports to empty nodes, they will experience intense packet
              loss, and be removed from the subnet. Try to capture the opposing factions' routers and prevent them from
              capturing yours.
              <br />
              <br />
              Your territory on the subnet is any space occupied by your routers, or fully encircled by them.
              <br />
              <br />
            </Typography>
          </Grid>
          <Grid item className={classes.instructionBoardWrapper}>
            <div className={classes.instructionBoard}>
              <GoGameboard
                boardState={getBoardFromSimplifiedBoardState(
                  [".....", "XO...", "XOO..", "XXO..", "XXO.."],
                  opponents.Daedalus,
                  playerColors.black,
                )}
                traditional={false}
                clickHandler={(x, y) => ({ x, y })}
                hover={true}
              />
            </div>
            <Typography variant="caption">
              This network of black routers is in trouble: they only have one open port, in the bottom-left. If their
              opponent puts a router there, the entire group will be captured!
            </Typography>
          </Grid>
        </Grid>
        <br />
        <br />
        <Grid container>
          <Grid item className={classes.instructionBoardWrapper}>
            <div className={classes.instructionBoard}>
              <GoGameboard
                boardState={getBoardFromSimplifiedBoardState(
                  ["OO.O.", "XOOOO", "XXXXX", "X..X.", "..XX."],
                  opponents.Daedalus,
                  playerColors.black,
                )}
                traditional={false}
                clickHandler={(x, y) => ({ x, y })}
                hover={true}
              />
            </div>
            <Typography variant="caption">
              In this completed game, the black routers occupy much more territory than white's network does.
            </Typography>
          </Grid>
          <Grid item className={classes.instructionsBlurb}>
            <Typography variant="h5">Winning the Subnet</Typography>
            <br />
            <Typography>
              The game ends when all of the open nodes on the subnet are completely surrounded by a single color, or
              when both players pass consecutively.
              <br />
              <br />
              Once the subnet is fully claimed, each player will get one point for each router on the board, plus a
              point for each empty node in territory that is completely surrounded by their routers or the edge of the
              subnet. <br />
              <br />
              White will also get a few points (called "komi") as a home-field advantage in the subnet, and to balance
              black's first-move advantage.
              <br />
              <br />
              You will gain some benefits from any territory you control at the end of the game, but winning rewards
              much higher bonuses.
            </Typography>
          </Grid>
        </Grid>
        <br />
        <br />
        <Grid container>
          <Grid item className={classes.instructionsBlurb}>
            <Typography variant="h5">Strategy</Typography>
            <br />
            <br />
            <Typography>
              * Pay attention to when a network of routers has only one or two open ports (or "liberties") to empty
              spaces. That is your opportunity to defend your network, or capture the opposing faction's.
              <br />
              <br />
              * Every faction has a different style, and different weaknesses. Try to identify what they are good and
              bad at doing.
              <br />
              <br />
              * The best way to learn strategies is to experiment and find out what works! <br />
              <br />* This game is a slightly simplified version of Go. For more rule details and strategies try{" "}
              <Link href={"https://way-to-go.gitlab.io/#/en/capture-stones"} target={"_blank"} rel="noreferrer">
                The Way to Go interactive guide.
              </Link>{" "}
              <br />
              <br />
            </Typography>
          </Grid>
          <Grid item className={classes.instructionBoardWrapper}>
            <div className={classes.instructionBoard}>
              <GoGameboard
                boardState={getBoardFromSimplifiedBoardState(
                  [".....", ".....", "...XX", "XXXX.", "X.X.."],
                  opponents.Daedalus,
                  playerColors.black,
                )}
                traditional={false}
                clickHandler={(x, y) => ({ x, y })}
                hover={true}
              />
            </div>
            <Typography variant="caption">
              This black network is very secure and hard to capture, because it has many open ports.
            </Typography>
          </Grid>
        </Grid>
        <br />
        <br />
        <Grid container>
          <Grid item className={classes.instructionBoardWrapper}>
            <div className={classes.instructionBoard}>
              <GoGameboard
                boardState={getBoardFromSimplifiedBoardState(
                  [".XXXX", "XXOOO", "OO...", "....O", "...O."],
                  opponents.Daedalus,
                  playerColors.black,
                )}
                traditional={false}
                clickHandler={(x, y) => ({ x, y })}
                hover={true}
              />
            </div>
            <Typography variant="caption">
              The black player cannot put a router in the bottom-left corner (A.1) or the top-right corner (E.5), as it
              would cause their router(s) to be captured.
              <br />
              <br />
              However, the white player CAN place a router in the bottom-left node: it is a legal move only because it
              captures the surrounding pieces.
            </Typography>
          </Grid>
          <Grid item className={classes.instructionsBlurb}>
            <Typography variant="h5">Special Rules</Typography>
            <br />
            <br />
            <Typography>
              * You cannot place a router on a node with no open ports (or on a node that removes all open ports your
              network), unless it will capture a network of opponent's routers first.
              <br />
              <br />
              To make sure your router networks are hard to capture, make sure to build around a few empty nodes
              ("eyes") inside of the network, so you never completely run out of open ports!
              <br />
              <br />
              * You cannot repeat previous board states. This rule prevents infinite loops of capturing and
              re-capturing.
              <br />
              <br />
              Note that you CAN re-capture eventually, but you must play somewhere else on the board first, to make the
              overall board state different.
            </Typography>
          </Grid>
        </Grid>
        <br />
      </>
    </div>
  );
};
