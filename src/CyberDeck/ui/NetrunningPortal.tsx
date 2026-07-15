import React from "react";
import { Container } from "@mui/material";
import { cyberdeckStyles } from "./cyberdeckStyles";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";

export function NetrunningPortal(): React.ReactElement {
  const { classes } = cyberdeckStyles();
  const [entering, setEntering] = React.useState(false);
  function handlePortalClick() {
    SnackbarEvents.emit(`Portal clicked!`, ToastVariant.SUCCESS, 2000);
    setEntering(true);
  }
  return (
    <Container disableGutters maxWidth={false} sx={{ m: 3 }}>
      <div className={`${classes.portalContainer} ${entering ? classes.enteringPortal : ""}`} onClick={handlePortalClick}>
        <div className={classes.portalRing}></div>
        <div className={`${classes.portalRing} ${classes.portalRingReverse}`}></div>
        <div className={`${classes.orbiter}`}></div>
        <div className={`${classes.portalCore}`}></div>
      </div>
    </Container>
  );
}