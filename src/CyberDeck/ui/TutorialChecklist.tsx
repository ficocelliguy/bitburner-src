import React from "react";
import {  Typography } from "@mui/material";
import CheckBoxOutlineBlankSharpIcon from "@mui/icons-material/CheckBoxOutlineBlankSharp";
import CheckBoxSharpIcon from "@mui/icons-material/CheckBoxSharp";
import MedicalInformationSharpIcon from "@mui/icons-material/MedicalInformationSharp";
import { CyberdeckState } from "../models/CyberdeckState";


export function TutorialChecklist() {
  return (
    <div style={{ position: "absolute", marginTop: "410px" }}>
      <Typography variant="body2">Tutorial!</Typography>

      <Typography variant="body2">
        {CyberdeckState.tutorialSteps.hasInstalledMod ? (
          <CheckBoxSharpIcon width="20px" height="20px" />
        ) : (
          <CheckBoxOutlineBlankSharpIcon width="20px" height="20px" />
        )}
        <span
          style={{
            position: "relative",
            top: "-7px",
            textDecoration: CyberdeckState.tutorialSteps.hasInstalledMod ? "line-through" : "none",
          }}
        >
          Drag a mod from storage to the cyberdeck rack
        </span>
      </Typography>

      <Typography variant="body2">
        {CyberdeckState.tutorialSteps.hasMadeConnection ? (
          <CheckBoxSharpIcon width="20px" height="20px" />
        ) : (
          <CheckBoxOutlineBlankSharpIcon width="20px" height="20px" />
        )}
        <span
          style={{
            position: "relative",
            top: "-7px",
            textDecoration: CyberdeckState.tutorialSteps.hasMadeConnection ? "line-through" : "none",
          }}
        >
          Drag between mod sockets to make a connection
        </span>
      </Typography>

      <Typography variant="body2">
        {CyberdeckState.tutorialSteps.hasChargedModule ? (
          <CheckBoxSharpIcon width="20px" height="20px" />
        ) : (
          <CheckBoxOutlineBlankSharpIcon width="20px" height="20px" />
        )}
        <span
          style={{
            position: "relative",
            top: "-7px",
            textDecoration: CyberdeckState.tutorialSteps.hasChargedModule ? "line-through" : "none",
          }}
        >
          Charge a module via connection to the I/O Panel
        </span>
      </Typography>

      <Typography variant="body2">
        {CyberdeckState.tutorialSteps.hasConsumedSkillchip ? (
          <CheckBoxSharpIcon width="20px" height="20px" />
        ) : (
          <CheckBoxOutlineBlankSharpIcon width="20px" height="20px" />
        )}
        <span
          style={{
            position: "relative",
            top: "-7px",
            textDecoration: CyberdeckState.tutorialSteps.hasConsumedSkillchip ? "line-through" : "none",
          }}
        >
          Consume a <MedicalInformationSharpIcon sx={{top: "5px", position: "relative"}}/> skillchip mod by charging it
        </span>
      </Typography>

      <Typography variant="body2">
        {CyberdeckState.tutorialSteps.hasCraftedIcebreaker ? (
          <CheckBoxSharpIcon width="20px" height="20px" />
        ) : (
          <CheckBoxOutlineBlankSharpIcon width="20px" height="20px" />
        )}
        <span
          style={{
            position: "relative",
            top: "-7px",
            textDecoration: CyberdeckState.tutorialSteps.hasCraftedIcebreaker ? "line-through" : "none",
          }}
        >
          Craft some icebreakers on the crafting page
        </span>
      </Typography>

      <Typography variant="body2">
        {CyberdeckState.tutorialSteps.hasNetrun ? (
          <CheckBoxSharpIcon width="20px" height="20px" />
        ) : (
          <CheckBoxOutlineBlankSharpIcon width="20px" height="20px" />
        )}
        <span
          style={{
            position: "relative",
            top: "-7px",
            textDecoration: CyberdeckState.tutorialSteps.hasNetrun ? "line-through" : "none",
          }}
        >
          Gain new mods by netrunning
        </span>
      </Typography>
    </div>
  );
}