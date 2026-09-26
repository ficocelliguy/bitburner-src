import { keyframes } from "@emotion/react";
import { useTheme } from "@mui/material/styles";
import { fadeLoop } from "../../Go/boardState/goStyles";
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
const pulse = keyframes`
   0%, 100% { transform: scale(1); opacity: 0.8; }
   50% { transform: scale(1.15); opacity: 1; }
`;
const flicker = keyframes`
   0% { filter: invert(0); }
   25% { filter: invert(0.8); }
   100% { filter: invert(0); }
`;
const shake = keyframes`
  0% { transform: translateY(-2px) rotate(2deg) }
  25% { transform: translateY(2px) rotate(-2deg) }
  35% { transform: translateY(-2px) rotate(2deg) }
  55% { transform: translateY(1px) rotate(-1deg) }
  65% { transform: translateY(-1px) rotate(1deg) }
  75% { transform: translateY(0px) rotate(-0.5deg) }
  100% { transform: translateY(0) rotate(0) }
`;
const shine = keyframes`
  0% {
    left: -200%;
  }
  40% {
    left: 150%;
  }
  100% {
    left: 150%;
  }
`;

const getSkewFrames = () => {
  let result = "";
  const step = 2;
  for (let i = 0; i < 100; i += step) {
    const range = i > 94 ? 8 : 3;
    const hueRotate = Math.random() < 0.8 ? 0 : Math.floor(Math.random() * 5 + 70);
    const scale = Math.random() < 0.92 ? 1 : 1.3;
    const invert = Math.random() < 0.95 ? 0 : 0.2;
    const shouldSkew = Math.random() < 0.4;
    const skew1 = shouldSkew ? Math.random() * range - range / 2 : 0;
    const skew2 = shouldSkew ? Math.random() * 2 - 1 : 0;

    const transform = ` { transform: skew(${skew1}deg, ${skew2}deg) scale(${scale}); filter: hue-rotate(${hueRotate}deg) invert(${invert}); }\n`;
    result += `${i}% ${transform}`;
    result += `${i + step - 0.1}% ${transform}`;
  }
  return result;
};

const skewFrames = keyframes`${getSkewFrames()}`;

const growAndFade = keyframes`
  0% {
    opacity: 1;
    transform: scale(1);
  }
  80% {
    opacity: 0;
  }
  100% {
    opacity: 0;
    transform: scale(20);
  }
`;

const staticNoise = keyframes`
  0% { transform: translate(0, 0);  background-size: 100%}
  100% { transform: translate(-1%, 0.5%); background-size: 200%}
`;

export const tickerLoop = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

export const PORTAL_CONTAINER_CLASS = "portal-container";
export const PORTAL_RING_CLASS = "portal-ring";
export const PORTAL_RING_REVERSE_CLASS = "portal-ring-reverse";
export const PORTAL_CORE_CLASS = "portal-core";

export function useCyberdeckStyles() {
  const theme = useTheme();
  return {
    modulePanel: {
      margin: "3px",
      display: "inline-flex",
      boxSizing: "border-box",
      cornerTopLeftShape: "bevel",
      borderTopLeftRadius: "10px",
      width: "462px",
      height: "60px",
    },
    socketIOPanel: {
      display: "inline-flex",
      border: `1px solid ${theme.palette.secondary.dark}`,
      borderRadius: "8px",
      cornerShape: "bevel",
      margin: "6px 2px",
    },
    emptyModuleSlot: {
      width: "100%",
      border: `1px solid ${theme.colors.button}`,
      margin: "6px",
      borderTop: `1px solid ${theme.colors.button}`,
      borderTopLeftRadius: "7px",
      cornerTopLeftShape: "bevel",
    },
    statsPanel: {
      border: `1px solid ${theme.palette.secondary.dark}`,
      borderRadius: "8px",
      cornerShape: "bevel",
      background: theme.colors.button,
      margin: "6px 2px",
      width: "130px",
      minWidth: 0,
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
    shake: {
      animation: `${shake} 0.3s steps(1)`,
    },
    shine: (delaySeconds: number) => ({
      position: "relative",
      overflow: "hidden",
      borderColor: Settings.theme.money,
      ["&::after"]: {
        content: "''",
        position: "absolute",
        top: 0,
        left: "-150%",
        width: "50%",
        height: "100%",

        background: `linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.8) 50%,
          rgba(255, 255, 255, 0) 100%
        )`,
        transform: "skewX(-20deg)",
        animation: `${shine} 3s infinite ease-in-out`,
        animationDelay: `${delaySeconds}s`,
      },
    }),
    buttonHighlight: {
      borderStyle: "solid",
      borderWidth: "6px",
      borderColor: theme.colors.success,
      padding: "0 12px",
      animation: `${fadeLoop} 600ms ease-in-out infinite alternate`,
    },
    offlineNode: {
      backgroundImage: `repeating-radial-gradient(circle at 17% 32%, ${theme.colors.white}, black 0.00085px)`,
      backgroundPosition: "center",
      opacity: 0.8,

      animation: `${staticNoise} 0.3s steps(4) infinite`,
    },
  } as const;
}

export function usePortalStyles() {
  useTheme();
  return {
    portalContainer: {
      margin: "150px auto 10px auto",
      cursor: "pointer",
      position: "relative",
      width: "300px",
      height: "300px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transform: "scale(1)",
      transition: "transform 0.4s ease-out",
      isolation: "isolate",
      backgroundColor: "#000",
      overflow: "hidden",
      WebkitMaskImage: "radial-gradient(circle at center, #000 65%, rgba(0,0,0,0.9) 82%, transparent 90%)",
      maskImage: "radial-gradient(circle at center, #000 65%, rgba(0,0,0,0.9) 82%, transparent 90%)",
      borderRadius: "45%",
      "&:hover": {
        transform: "scale(1.08)",
      },
    },
    portalRing: {
      position: "absolute",
      width: "75%",
      height: "95%",
      borderRadius: "50%",
      border: "4px solid transparent",
      animation: `${spin} 5s linear infinite`,
      background:
        "linear-gradient(#0a0a16) padding-box, linear-gradient(to right, transparent 20% , #ff007b 25%, #00ff7b 50%, #ff007b 75%, transparent 80%) border-box",
      "&::after": {
        content: '""',
        position: "absolute",
        height: "90%",
        width: "90%",
        borderRadius: "50%",
        boxShadow: "0 0 40px rgba(189, 0, 255, 0.6), inset 0 0 30px rgba(189, 0, 255, 0.6)",
      },
    },
    portalRingReverse: {
      width: "65%",
      height: "85%",
      animation: `${spinReverse} 2s linear infinite`,
      background:
        "linear-gradient(#0a0a16) padding-box, linear-gradient(to right, transparent 20% , #f9d423, #ff4e50, #f9d423, transparent 80%) border-box",
      "&::after": {
        boxShadow: "0 0 40px rgba(0, 255, 123, 0.4), inset 0 0 30px rgba(0, 255, 123, 0.4)",
      },
    },
    portalDisabled: {
      cursor: "not-allowed",
      [`& .${PORTAL_RING_CLASS}`]: {
        animation: `${spin} 20s linear infinite`,
        "&::after": {
          boxShadow: "0 0 40px rgba(189, 0, 0, 0.6), inset 0 0 30px rgba(189, 0, 0, 0.6)",
        },
      },
      [`& .${PORTAL_RING_REVERSE_CLASS}`]: {
        animation: `${spinReverse} 15s linear infinite`,
        "&::after": {
          boxShadow: "0 0 40px rgba(255, 167, 86, 0.4), inset 0 0 30px rgba(255, 167, 86, 0.4)",
        },
      },
      [`& .${PORTAL_CORE_CLASS}`]: {
        background:
          "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(189,0,255,0.8) 50%, rgba(100,210,255,0) 100%)",
        animation: `${pulse} 5s ease-in-out infinite`,
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
      width: "40%",
      height: "40%",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(189,0,255,0.8) 50%, rgba(0,210,255,0) 100%)",
      animation: `${pulse} 1.5s ease-in-out infinite`,
      boxShadow: "0 0 80px #bd00ff",
    },
    portalTextMask: {
      position: "absolute",
      inset: 0,
      background: "#000",
      color: "#fff",
      mixBlendMode: "multiply",
      fontFamily: "monospace",
      fontSize: "13px",
      lineHeight: 1.4,
      letterSpacing: "0.5px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      pointerEvents: "none",
      userSelect: "none",
    },
    enteringPortal: {
      zIndex: 9999,
      pointerEvents: "none",
      animation: `${growAndFade} 1.2s ease-in forwards`,
    },
    corruptedSkew: {
      animation: `${skewFrames} 5s infinite steps(1)`,
      [`& .${PORTAL_CONTAINER_CLASS}`]: {
        "&:hover": {
          animation: `${flicker} 0.2s steps(1)`,
        },
      },
    },
  } as const;
}

/*

pop-up number:

.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

#hitButton {
  padding: 15px 30px;
  font-size: 1.2rem;
  background-color: #ff4757;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}


.damage-popup {
  position: absolute;
  font-family: monospace;
  font-size: 2.5rem;
  font-weight: 900;
  color: #ff3838;
  text-shadow:
  -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px  2px 0 #000,
    2px  2px 0 #000;
  pointer-events: none;
  user-select: none;


  animation: moba-damage 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}


@keyframes moba-damage {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
}
  15% {
    opacity: 1;
    scale(1.4);
  }
  30% {scale(1);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -220%) scale(0.8);
  }
}

const gameContainer = document.getElementById('gameContainer');
const hitButton = document.getElementById('hitButton');

hitButton.addEventListener('click', (e) => {
  // 1. Generate random damage value
  const damageAmount = Math.floor(Math.random() * 150) + 50;

  // 2. Create the element
  const damageText = document.createElement('div');
  damageText.classList.add('damage-popup');
  damageText.innerText = damageAmount;

  // 3. Randomize critical hits occasionally
  if (damageAmount > 170) {
    damageText.innerText += '!';
    damageText.style.color = '#ffa502';
    damageText.style.fontSize = '3.5rem';
  }

  // 4. Position it near the click (or target) with a slight offset variance
  const varianceX = (Math.random() - 0.5) * 40; // Max 20px left or right
  const varianceY = (Math.random() - 0.5) * 20;

  damageText.style.left = `${e.clientX + varianceX}px`;
  damageText.style.top = `${e.clientY + varianceY}px`;

  // 5. Append to container
  gameContainer.appendChild(damageText);

  // 6. Clean up DOM after animation completes
  damageText.addEventListener('animationend', () => {
    damageText.remove();
  });
});


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
void themeColors;
