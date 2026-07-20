import { Theme } from "@mui/material/styles";
import { makeStyles } from "tss-react/mui";
import { keyframes } from "tss-react";
import { Settings } from "../../Settings/Settings";


const spin = keyframes`
   0% { transform: rotate(0deg) scale(1); }
   50% { transform: rotate(180deg) scale(1.05); }
   100% { transform: rotate(360deg) scale(1); }
`;
const spinReverse = keyframes`
   0% { transform: rotate(0deg) scale(1); }
   50% { transform: rotate(-180deg) scale(0.95); }
   100% { transform: rotate(-360deg) scale(1); }
`;
const spinGradient = keyframes`
   0% { --gradient-angle: 0deg; }
   100% { --gradient-angle: 360deg; }
`;
const pulse = keyframes`
   0%, 100% { transform: scale(1); opacity: 0.8; }
   50% { transform: scale(1.15); opacity: 1; }
`;

const growAndFade = keyframes`
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(20);
  }
`;

export const cyberdeckStyles = makeStyles({ uniqId: "cyberdeckStyles" })((theme: Theme, __, __classes) => ({
  modulePanel: {
    margin: "3px",
    display: "inline-flex",
    boxSizing: "border-box",
    cornerTopLeftShape: "bevel",
    borderTopLeftRadius: "10px",
    width: "476px",
    height: "60px",
  },
  socketIOPanel: {
    display: "inline-flex",
    border: `1px solid ${Settings.theme.secondarydark}`,
    borderRadius: "10px",
    cornerShape: "bevel",
    margin: "6px 2px",
  },
  emptyModuleSlot: {
    width: "100%",
    border: `1px solid ${Settings.theme.button}`,
    margin: "6px",
    borderTop: `1px solid ${Settings.theme.button}`,
    borderTopLeftRadius: "7px",
    cornerTopLeftShape: "bevel",
  },
  statsPanel: {
    border: `1px solid ${Settings.theme.secondarydark}`,
    borderRadius: "10px",
    cornerShape: "bevel",
    background: Settings.theme.button,
    margin: "6px 2px",
    width: "130px",
    fontSize: "9px",
    alignContent: "center",
  },
  socket: {
    height: "24px",
    width: "24px",
    borderRadius: "50%",
    cursor: "crosshair",
  },
  tab: {
    paddingTop: 0,
    paddingBottom: 0,
    whiteSpace: "pre",
    height: "50px",
    minHeight: "unset",
    width: "210px",
  },
  portalContainer: {
    margin: "150px auto 10px auto",
    cursor: "pointer",
    position: "relative",
    width: "300px",
    height: "300px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "transform 0.5s ease-out",
    "&:hover": {
      transform: "scale(1.08)",
    },
  },
  portalRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    border: "4px solid transparent",
    animation: `${spin} 5s linear infinite`,
    background:
      "linear-gradient(#0a0a16) padding-box, linear-gradient(to right, transparent 20% , #ff007b 25%, #00ff7b 50%, #ff007b 75%, transparent 80%) border-box",
    "&::after": {
      content: '""',
      position: "absolute",
      height: "100%",
      width: "100%",
      borderRadius: "50%",
      boxShadow: "0 0 40px rgba(189, 0, 255, 0.6), inset 0 0 30px rgba(189, 0, 255, 0.6)",
    },
  },
  portalRingReverse: {
    width: "85%",
    height: "85%",
    animation: `${spinReverse} 2s linear infinite`,
    background:
      "linear-gradient(#0a0a16) padding-box, linear-gradient(to right, transparent 20% , #f9d423, #ff4e50, #f9d423, transparent 80%) border-box",
    "&::after": {
      boxShadow: "0 0 40px rgba(0, 255, 123, 0.4), inset 0 0 30px rgba(0, 255, 123, 0.4)",
    },
  },
  orbiter: {
    width: "1px",
    height: "100%",
    animation: `${spinReverse} 2s linear infinite`,
    boxShadow: "0 10px 20px -20px #ff4e50",
  },
  portalCore: {
    position: "absolute",
    width: "50%",
    height: "50%",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(189,0,255,0.8) 50%, rgba(0,210,255,0) 100%)",
    animation: `${pulse} 1.5s ease-in-out infinite`,
    boxShadow: "0 0 80px #bd00ff",
  },
  enteringPortal: {
    zIndex: 9999,
    pointerEvents: "none",
    animation: `${growAndFade} 1.5s ease-in forwards`,
  },
}));

/*

html<div class="spark-container"></div>



body {
  margin: 0;
  background-color: #000;
  overflow: hidden;
  height: 100vh;
  cursor: pointer;
}

.spark {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #ffd700;
  border-radius: 50%;
  pointer-events: none;
  animation: popOut 1.5s ease-out forwards;
}

@keyframes popOut {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0);
    opacity: 0;
  }
}




document.addEventListener('click', (e) => {
  const sparkCount = 12; // Number of sparks per click

  for (let i = 0; i < sparkCount; i++) {
    createSpark(e.clientX, e.clientY);
  }
});

function createSpark(x, y) {
  const spark = document.createElement('div');
  spark.classList.add('spark');

  // Set the start position
  spark.style.left = `${x}px`;
  spark.style.top = `${y}px`;

  // Random trajectory
  const destinationX = (Math.random() - 0.5) * 600;
  const destinationY = (Math.random() - 0.5) * 600;

  spark.style.setProperty('--tx', `${destinationX}px`);
  spark.style.setProperty('--ty', `${destinationY}px`);
  spark.style.setProperty("background-color", '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));

  document.body.appendChild(spark);

  // Remove after animation completes
  setTimeout(() => {
    spark.remove();
  }, 1500);
}
 */

// TODO-fico: remove once done
const themeColors = {
  primarylight: "#0f0",
  primary: "#0c0",
  primarydark: "#090",
  successlight: "#0f0",
  success: "#0c0",
  successdark: "#090",
  errorlight: "#f00",
  error: "#c00",
  errordark: "#900",
  secondarylight: "#AAA",
  secondary: "#888",
  secondarydark: "#666",
  warninglight: "#ff0",
  warning: "#cc0",
  warningdark: "#990",
  infolight: "#69f",
  info: "#36c",
  infodark: "#039",
  welllight: "#444",
  well: "#222",
  white: "#fff",
  black: "#000",
  hp: "#dd3434",
  money: "#ffd700",
  hack: "#adff2f",
  combat: "#faffdf",
  cha: "#a671d1",
  int: "#6495ed",
  rep: "#faffdf",
  disabled: "#66cfbc",
  backgroundprimary: "#000",
  backgroundsecondary: "#000",
  button: "#333",
  maplocation: "#ffffff",
  bnlvl0: "#ffff00",
  bnlvl1: "#ff0000",
  bnlvl2: "#48d1cc",
  bnlvl3: "#0000ff",
};