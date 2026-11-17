import React, { useEffect } from "react";
import { Box } from "@mui/material";
import { useRerender } from "../../ui/React/hooks";
import { activePopupTexts, activeSparks, FxEvents, removePopupText, removeSpark } from "../utils/fx";
import { useFxStyles } from "./cyberdeckStyles";

export function FxLayer(): React.ReactElement {
  const styles = useFxStyles();
  const rerender = useRerender();

  useEffect(() => {
    const clearSubscription = FxEvents.subscribe(() => rerender());
    return () => clearSubscription();
  }, [rerender]);

  return (
    <>
      {activeSparks.map((spark) => (
        <Box
          key={spark.id}
          sx={styles.spark}
          style={
            {
              left: spark.x,
              top: spark.y,
              backgroundColor: spark.color,
              "--tx": `${spark.tx}px`,
              "--ty": `${spark.ty}px`,
            } as React.CSSProperties
          }
          onAnimationEnd={() => removeSpark(spark.id)}
        />
      ))}
      {activePopupTexts.map((popupText) => (
        <Box
          key={popupText.id}
          sx={styles.popupText}
          style={{ left: popupText.x, top: popupText.y, color: popupText.color, fontSize: popupText.fontSize }}
          onAnimationEnd={() => removePopupText(popupText.id)}
        >
          {popupText.text}
        </Box>
      ))}
    </>
  );
}
