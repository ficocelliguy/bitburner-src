import React from "react";

import Typography from "@mui/material/Typography";
import { Modal } from "../ui/React/Modal";

interface IProps {
  open: boolean;
  onClose: () => void;
}

export const GoInfoModal = ({ open, onClose }: IProps): React.ReactElement => {
  return (
    <Modal open={open} onClose={onClose}>
      <>
        <Typography variant="h4">IPvGO</Typography>
        <Typography>
          In late 2070, the .org bubble burst, and most of the newly-implemented IPvGO 'net collapsed overnight. Since
          then, various factions have fought over small subnets for their own use. These subnets are very valuable in
          the right hands, if you can wrest them from their current owners.
        </Typography>
        <br />
        <br />
        <Typography variant="h5">How to take over IPvGO Subnets</Typography>
        <Typography>
          Your goal is to control more territory in the subnet than the faction currently holding it!
          <br />
          <br />
          Each turn, you may place a router on a node on the subnet, or pass. The router will connect to your adjacent
          routers, forming networks. A network's open ports to adjacent spaces are shown visually.
          <br />
          <br />
          If a group of routers no longer has any open ports to empty nodes, they will experience intense packet loss,
          and be removed from the subnet. Try to capture the opposing factions' routers and prevent them from capturing
          yours.
          <br />
        </Typography>
        <br />
        <br />
        <Typography variant="h5">Winning the Subnet</Typography>
        <Typography>
          When the subnet is filled, each player will get one point for each router on the board, plus a point for each
          empty node in territory that is completely surrounded by their routers or the edge of the subnet. <br />
          <br />
          White will also get a few points, called "komi", as a home-field advantage in the subnet and to balance
          black's first-move advantage.
        </Typography>
        <br />
        <br />
        <Typography variant="h5">Strategy</Typography>
        <Typography>
          * Every faction has a different style, and different weaknesses. Try to identify what they are good and bad at
          doing.
          <br />
          * Pay attention to when a network of routers has only one or two open ports (or "liberties"). That is your
          opportunity to defend your network, or capture the opposing faction's.
          <br />
          * To make sure your router networks are hard to capture, make sure to build around a few empty node ("eyes")
          inside of the network, so you never completely run out of open ports.
          <br />
          * The best way to learn strategies is to experiment and find out what works! <br />
          * This game is a slightly simplified version of Go. For more rule details and strategies try [The Way to Go
          interactive guide.](https://way-to-go.gitlab.io/#/en/capture-stones) <br />
        </Typography>
        <br />
        <br />
        <Typography variant="h5">Special Rules</Typography>
        <Typography>
          * You cannot place a router on a node with no open ports (or on a node that removes all open ports of a
          network of your routers), unless it will capture a network of opponent's routers first. * You cannot repeat
          previous board states. This prevents infinite loops of capturing and re-capturing. (Note that you CAN
          re-capture in these cases, but you must play somewhere else on the board first, to make the overall board
          state different)
        </Typography>

        <br />
      </>
    </Modal>
  );
};
