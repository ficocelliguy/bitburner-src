import { Theme } from "@mui/material/styles";
import { makeStyles } from "tss-react/mui";
import { Settings } from "../../Settings/Settings";


export const cyberdeckStyles = makeStyles({ uniqId: "cyberdeckStyles" })((theme: Theme, __, __classes) => ({
  socketIOPanel: {
    display: "inline-flex",
    border: `1px solid ${Settings.theme.secondarydark}`,
    borderRadius: "10px",
    cornerShape: "bevel",
    margin: "6px 2px",
  },
  socket: {
    height: "24px",
    width: "24px",
    borderRadius: "50%",
    cursor: "crosshair",
  },
}));
