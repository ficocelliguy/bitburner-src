const SPARK_CLASS = "cyberdeck-spark";
const SPARK_STYLE_ID = "cyberdeck-spark-styles";

function ensureSparkStyles() {
  if (document.getElementById(SPARK_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = SPARK_STYLE_ID;
  style.textContent = `
    .${SPARK_CLASS} {
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 90001;
      animation: cyberdeck-spark-popout 1.5s ease-out forwards;
    }
    @keyframes cyberdeck-spark-popout {
      0%   { transform: translate(0, 0) scale(1); opacity: 1; }
      100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function createSpark(x: number, y: number, color: string) {
  const spark = document.createElement("div");
  spark.classList.add(SPARK_CLASS);

  spark.style.left = `${x}px`;
  spark.style.top = `${y}px`;

  const destinationX = (Math.random() - 0.5) * 800;
  const destinationY = (Math.random() - 0.5) * 800;

  spark.style.setProperty("--tx", `${destinationX}px`);
  spark.style.setProperty("--ty", `${destinationY}px`);
  spark.style.backgroundColor = color;

  document.body.appendChild(spark);

  setTimeout(() => {
    spark.remove();
  }, 1500);
}

function getRandomHexColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}

export function createSparkles(x: number, y: number, color: string = "") {
  ensureSparkStyles();
  const sparkCount = 16;
  for (let i = 0; i < sparkCount; i++) {
    createSpark(x, y, color || getRandomHexColor());
  }
}
