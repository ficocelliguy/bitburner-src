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
              Your goal is to control more <i>empty nodes</i> in the subnet than the faction currently holding it, by
              surrounding those open nodes with your routers.
              <br />
              <br />
              Each turn you place a router in an empty node (or pass). The router will connect to your adjacent routers,
              forming networks. A network's remaining open ports are indicated by lines heading out towards the empty
              nodes adjacent to the network.
              <br />
              <br />
              If a group of routers no longer is connected to any empty nodes, they will experience intense packet loss
              and be removed from the subnet. Make sure you ALWAYS have access to several empty nodes in each of your
              networks! A network with only one remaining open port will start to fade in and out, because it is at risk
              of being destroyed.
              <br />
              <br />
              You also can use your routers to limit your opponent's access to empty nodes as much as possible. Cut a
              network off from any empty nodes, and their entire group of routers will be removed!
              <br />
              <br />
            </Typography>
          </Grid>
          <Grid item className={classes.instructionBoardWrapper}>
            <div className={classes.instructionBoard}>
              <GoGameboard
                boardState={getBoardFromSimplifiedBoardState(
                  [".....", "XO...", "XOO..", "XXO..", "XXO.."],
                  opponents.none,
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
                  opponents.none,
                  playerColors.black,
                )}
                traditional={false}
                clickHandler={(x, y) => ({ x, y })}
                hover={true}
              />
            </div>
            <Typography variant="caption">
              In this completed game, the black routers surround many more empty nodes than white's network does.
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
              Once the subnet is fully claimed, each player will get one point for each empty node they fully surround
              on the subnet, plus a point for each router they have. You can use the edge of the board along with your
              routers to fully surround and claim empty nodes. <br />
              <br />
              White will also get a few points (called "komi") as a home-field advantage in the subnet, and to balance
              black's advantage of having the first move.
              <br />
              <br />
              You will gain some stat multiplier benefit from any territory you control at the end of the game, but
              winning rewards much higher bonuses.
            </Typography>
          </Grid>
        </Grid>
        <br />
        <br />
        <Grid container>
          <Grid item className={classes.instructionsBlurb}>
            <Typography variant="h5">Special Rule Details</Typography>
            <br />
            <br />
            <Typography>
              * You cannot suicide your own routers by cutting off access to their last remaining open node. You also
              cannot suicide a router by placing it in a node that is completely surrounded by your opponent's routers.
              <br />
              <br />
              * There is one exception to the suicide rule: You can place a router on ANY node if it would capture any
              of the opponent's routers.
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
          <Grid item className={classes.instructionBoardWrapper}>
            <div className={classes.instructionBoard}>
              <GoGameboard
                boardState={getBoardFromSimplifiedBoardState(
                  [".....", ".....", "...XX", "XXXX.", "X.X.."],
                  opponents.none,
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
                  opponents.none,
                  playerColors.black,
                )}
                traditional={false}
                clickHandler={(x, y) => ({ x, y })}
                hover={true}
              />
            </div>
            <Typography variant="caption">
              The black player cannot put a router in the bottom-left corner (A.1) or the top-right corner (E.5), as it
              would cause their routers to suicide.
              <br />
              <br />
              However, the white player CAN place a router in the bottom-left node: it is a legal move ONLY because it
              captures the surrounding pieces.
            </Typography>
          </Grid>
          <Grid item className={classes.instructionsBlurb}>
            <Typography variant="h5">Strategy</Typography>
            <br />
            <br />
            <Typography>
              * You can place routers and look at the board state via the "go" api.
              <br />
              <br />
              * Pay attention to when a network of routers has only one or two open ports to empty spaces! That is your
              opportunity to defend your network, or capture the opposing faction's.
              <br />
              <br />
              To make sure your router networks are hard to capture, make sure to build around a few empty nodes inside
              of the network, so you never completely run out of open ports!
              <br />
              <br />
              * Every faction has a different style, and different weaknesses. Try to identify what they are good and
              bad at doing.
              <br />
              <br />
              * The best way to learn strategies is to experiment and find out what works!
              <br />
              <br />* This game is Go with slightly simplified scoring. For more rule details and strategies try{" "}
              <Link href={"https://way-to-go.gitlab.io/#/en/capture-stones"} target={"_blank"} rel="noreferrer">
                The Way to Go interactive guide.
              </Link>{" "}
              <br />
              <br />
            </Typography>
          </Grid>
        </Grid>
        <br />
      </>
    </div>
  );
};
