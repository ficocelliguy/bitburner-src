import React, { useCallback, useEffect } from "react";
import { Draggable } from "react-beautiful-dnd";
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import { CyberdeckEvents, CyberdeckState, getChargedModuleIDs } from "../models/CyberdeckState";
import { Settings } from "../../Settings/Settings";
import { DeckMod, ModType, Socket } from "../Types";
import { useRerender } from "../../ui/React/hooks";
import { getModuleIcon, getRarityColor } from "./Icons";
import { SocketIOPanel } from "./SocketIOPanel";
import { Box, Tooltip, Typography } from "@mui/material";
import { StatBonus } from "./StatBonuses";
import { useCyberdeckStyles } from "./cyberdeckStyles";
import { getModuleDescription, isCustomBuild } from "../models/constants";

export type DeckModuleProps = {
  module: DeckMod;
  index: number;
  draggingWireStarted?: ((moduleId: string, socketId: number) => void) | null;
  draggingWireEnded?: ((moduleId: string) => void) | null;
  currentDragSource?: Socket | null;
  isAnyDragActive?: boolean;
  draggingInstalledModule?: boolean;
  allowShift?: boolean;
};

export function ModuleComponent({
  module,
  index,
  allowShift,
  draggingWireStarted,
  draggingWireEnded,
  draggingInstalledModule,
  currentDragSource,
  isAnyDragActive,
}: DeckModuleProps) {
  const render = useRerender(200);
  const styles = useCyberdeckStyles();
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const updateDisplay = useCallback(() => {
    render();
  }, [render]);

  useEffect(() => {
    const clearSubscription = CyberdeckEvents.subscribe(() => updateDisplay());
    updateDisplay();
    return () => clearSubscription();
  }, [updateDisplay]);

    const chargedModuleIDs = getChargedModuleIDs();

  function socketDragEnd() {
    draggingWireEnded?.(module.id);
  }

  function openTooltipOnRightClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      module.favorite = !module.favorite;
    }
  }

  function getRarityText(rarity: number): string {
    if (rarity < 0) {
      return "[Corrupted]";
    }
    return `[Rarity ${rarity}]`;
  }

  return (
    <Draggable draggableId={module.id} index={index} isDragDisabled={!allowShift}>
      {(provided) => (
        <Tooltip
          title={
            <div>
              <Typography variant="h6" style={{ margin: "4px", textAlign: "center" }}>
                {module.type} {getRarityText(module.level)}
              </Typography>
              <div style={{ color: Settings.theme.warning }}>
                {chargedModuleIDs.includes(module.id) ? "" : "(Not powered - provides no bonuses.)"}
              </div>{" "}
              <Typography
                sx={{ fontSize: "8px", color: Settings.theme.secondary, width: "300px", textAlign: "center" }}
              >
                ID: {module.id}
              </Typography>
              <div style={{ margin: "10px 0" }}>
                <StatBonus stats={module.stats} useShortStatNames={false} fontSize={14} />
              </div>
              <Typography sx={{ fontSize: "10px", color: Settings.theme.secondary, width: "300px" }}>
                {getModuleDescription(module.type)}
              </Typography>
            </div>
          }
          open={!isAnyDragActive && tooltipOpen}
          placement={index % 2 === 0 ? "top-end" : "top-start"}
          arrow
          enterDelay={600}
          enterNextDelay={400}
          onOpen={() => setTooltipOpen(true)}
          onClose={() => setTooltipOpen(false)}
        >
          <Box
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              zIndex: 1,
              position: "relative",
              ...provided.draggableProps.style,
              border: `2px solid ${
                module.type === ModType.CyberdeckIOPanel
                  ? Settings.theme.button
                  : getChargedModuleIDs().includes(module.id)
                  ? getRarityColor(module)
                  : Settings.theme.welllight
              }`,
              background: getChargedModuleIDs().includes(module.id)
                ? Settings.theme.button
                : Settings.theme.backgroundprimary,
            }}
            sx={styles.modulePanel}
            onMouseUp={() => socketDragEnd()}
            onMouseDown={openTooltipOnRightClick}
            onContextMenu={(e) => e.preventDefault()}
          >
            {module.type !== ModType.CyberdeckIOPanel ? (
              <>
                <div>{getModuleIcon(module)}</div>
                {module.favorite && (
                  <div style={{ position: "absolute", top: 0, left: "30px", color: Settings.theme.warning }}>
                    <StarBorderOutlinedIcon style={{ width: "20px", height: "20px" }} />
                  </div>
                )}
                <Box sx={styles.statsPanel}>
                  <StatBonus stats={module.stats} />
                </Box>
              </>
            ) : (
              <div>
                {isCustomBuild() ? (
                  <>
                    <Typography
                      style={{
                        width: "179px",
                        marginTop: "8px",
                        fontSize: "13px",
                        textAlign: "center",
                        fontStyle: "italic",
                      }}
                    >
                      Ono-Sendai Mk7
                    </Typography>
                    <Typography
                      style={{
                        width: "179px",
                        textAlign: "center",
                        marginTop: "3px",
                        fontSize: "11px",
                        fontStyle: "italic",
                      }}
                    >
                      Custom Build
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography
                      style={{
                        width: "179px",
                        marginTop: "6px",
                        fontSize: "13px",
                        textAlign: "center",
                        fontStyle: "italic",
                      }}
                    >
                      Hosaka Mark I
                    </Typography>
                    <Typography style={{ width: "179px", marginTop: "4px", textAlign: "center" }}>
                      保坂 マークI
                    </Typography>
                  </>
                )}
              </div>
            )}
            <SocketIOPanel
              moduleId={module.id}
              sockets={module.sockets}
              currentDragSource={currentDragSource}
              draggingWireStarted={draggingWireStarted}
              draggingInstalledModule={draggingInstalledModule}
            />
          </Box>
        </Tooltip>
      )}
    </Draggable>
  );
}
