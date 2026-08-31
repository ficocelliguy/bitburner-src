import React, { useRef, useState } from "react";
import { Typography } from "@mui/material";
import { DeckMod } from "../Types";
import { ModuleComponent } from "./ModuleComponent";
import { Settings } from "../../Settings/Settings";
import { getRarityColor } from "./Icons";
import { createSparkles } from "../utils/fx";

export function ModuleLootCover({ module, index }: { module: DeckMod; index: number }) {
  const [open, setOpen] = useState(false);
  const cover = useRef<HTMLDivElement>(null);

  function reveal() {
    setOpen(true);
    setTimeout(celebrationSparkles, 500);
  }

  function celebrationSparkles() {
    if ((module.rarity < 3 && module.rarity !== -1) || !cover?.current) {
      return;
    }
    const color = getRarityColor(module);

    const bound = cover.current.getBoundingClientRect();
    const randomX1 = bound.left + bound.width * 0.1 * Math.random();
    const randomY1 = bound.top + bound.height * 0.6;

    createSparkles(randomX1, randomY1, color);

    if (module.rarity < 5) {
      return;
    }

    const randomX2 = bound.left + bound.width * 0.1 * Math.random() + bound.width * 0.9;
    const randomY2 = bound.top + bound.height * 0.7;

    setTimeout(() => createSparkles(randomX2, randomY2, color), 300);

    if (module.rarity < 7) {
      return;
    }

    const randomX3 = bound.left + bound.width * 0.2 * Math.random() + bound.width * 0.55;
    const randomY3 = bound.top + bound.height * 0.2;

    setTimeout(() => createSparkles(randomX3, randomY3), 600);
  }

  return (
    <Typography
      component="div"
      onClick={reveal}
      sx={
        open
          ? {
              backgroundColor: Settings.theme.backgroundprimary,
              height: "68px",
            }
          : {
              cursor: "pointer",
              backgroundColor: Settings.theme.backgroundprimary,
              border: `1px solid ${Settings.theme.button}`,
              height: "68px",
              "&:hover": { backgroundColor: Settings.theme.button },
            }
      }
    >
      {open ? "   " : "Click to reveal..."}
      <div style={{ opacity: open ? 1 : 0, transition: "opacity 1s ease-in" }} ref={cover}>
        <ModuleComponent module={module} index={index} allowShift={true} />
      </div>
    </Typography>
  );
}
