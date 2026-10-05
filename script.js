/*
to do next:
1.make the sound start from the beginning when the user clicks play again
2.add volume control
3.make the sound loop
4.add keyboard mapping or a controller ui for up left down right
5.make ui better for mobile
*/

const levels = [
  {
    name: "The Pumpkin Patch",
    layout: [
      "S.....###",
      "#####.###",
      ".....C..#",
      ".#####.##",
      ".#.......",
      ".#.######",
      ".#......#",
      ".######.#",
      "........E"
    ],
    bats: [[0, 8], [3, 1]]
  },
  {
    name: "Candy Corn Crossing",
    layout: [
      "S.......#",
      "#######.#",
      "...C.....",
      ".########",
      "......C..",
      "########.",
      ".C.......",
      ".########",
      "........E"
    ],
    bats: [[1, 0], [5, 4], [7, 8]]
  },
  {
    name: "Batwing Bend",
    layout: [
      "S...#####",
      "###.#####",
      "...C#####",
      ".########",
      ".....####",
      "####.####",
      "....C...#",
      "#######.#",
      "........E"
    ],
    bats: [[0, 5], [3, 4], [5, 2]]
  },
  {
    name: "The Crimson Crypt",
    layout: [
      "S....####",
      "####.####",
      "C...C####",
      "####.####",
      "........C",
      ".#######.",
      ".C.......",
      "########.",
      "........E"
    ],
    bats: [[0, 6], [1, 2], [3, 6], [7, 2]]
  },
  {
    name: "Midnight Keep",
    layout: [
      "S....####",
      "####.####",
      "C...C...#",
      "####.##.#",
      "...C...##",
      ".#######.",
      ".C......#",
      "#######.#",
      ".......E#"
    ],
    bats: [[0, 7], [2, 8], [3, 1], [5, 4], [8, 8]]
  }
];

const maze = document.getElementById("maze");
const moveCount = document.getElementById("move-count");
const candyCount = document.getElementById("candy-count");
const gameMessage = document.getElementById("game-message");
const levelIndicator = document.getElementById("level-indicator");
const levelTitle = document.getElementById("level-title");
const levelProgress = document.getElementById("level-progress");
const gameLayout = document.querySelector(".game-layout");
const lessonPanel = document.getElementById("lesson-panel");
const resetButton = document.getElementById("reset-button");
const nextLevelButton = document.getElementById("next-level-button");
const playAgainButton = document.getElementById("play-again-button");
const musicButton = document.getElementById("music-button");
const music = document.getElementById("bg-music");
const welcomePanel = document.getElementById("welcome-panel");
const playerForm = document.getElementById("player-form");
const playerNameInput = document.getElementById("player-name");
const congratulationsHeading = document.getElementById("congratulations-heading");
const confettiLayer = document.getElementById("confetti-layer");
const cheerAudio = document.getElementById("cheer-audio");
let levelIndex = 0;
let player = { row: 0, column: 0 };
let moves = 0;
let completed = false;
let collectedCandy = new Set();
let completedLevels = new Set();
let playerName = "";

function getLevelCandyCount() {
  return currentLevel.layout.join("").split("C").length - 1;
}

function isOpen(row, column) {
  return currentLevel.layout[row]?.[column] !== undefined && currentLevel.layout[row][column] !== "#";
}

function isAdjacent(row, column) {
  return Math.abs(player.row - row) + Math.abs(player.column - column) === 1;
}

function updateLevelProgress() {
  levelProgress.replaceChildren();
  levels.forEach((level, index) => {
    const marker = document.createElement("span");
    marker.className = "level-marker";
    marker.textContent = String(index + 1);
    marker.setAttribute("aria-label", `Level ${index + 1}${completedLevels.has(index) ? ", complete" : ""}`);
    if (index === levelIndex) marker.setAttribute("aria-current", "step");
    if (completedLevels.has(index)) marker.classList.add("is-complete");
    levelProgress.appendChild(marker);
  });
}

function updateCandyCount() {
  candyCount.textContent = `${collectedCandy.size} / ${getLevelCandyCount()}`;
}

function showConfetti() {
  const colors = ["#ff4656", "#ffd34d", "#fff0d6", "#f36f42", "#b3162f"];
  const pieces = document.createDocumentFragment();

  for (let index = 0; index < 90; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--confetti-color", colors[index % colors.length]);
    piece.style.setProperty("--confetti-delay", `${Math.random() * 0.75}s`);
    piece.style.setProperty("--confetti-duration", `${2.2 + Math.random() * 1.8}s`);
    piece.style.setProperty("--confetti-drift", `${Math.round((Math.random() - 0.5) * 240)}px`);
    piece.style.setProperty("--confetti-size", `${5 + Math.random() * 7}px`);
    pieces.appendChild(piece);
  }

  confettiLayer.replaceChildren(pieces);
  window.setTimeout(() => confettiLayer.replaceChildren(), 5000);
}

function clearConfetti() {
  confettiLayer.replaceChildren();
}

function renderMaze(focusPlayer = false) {
  maze.replaceChildren();
  maze.setAttribute("aria-label", `${currentLevel.name}, level ${levelIndex + 1} maze`);
  maze.style.gridTemplateColumns = `repeat(${currentLevel.layout[0].length}, minmax(0, 1fr))`;

  currentLevel.layout.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      if (cell === "#") {
        const hedge = document.createElement("div");
        hedge.className = "tile hedge";
        hedge.setAttribute("role", "presentation");

        if (currentLevel.bats.some(([batRow, batColumn]) => batRow === rowIndex && batColumn === columnIndex)) {
          const bat = document.createElement("img");
          bat.src = "assets/bat.png";
          bat.alt = "";
          bat.className = "bat-sprite";
          hedge.appendChild(bat);
        }

        maze.appendChild(hedge);
        return;
      }

      const positionKey = `${rowIndex},${columnIndex}`;
      const isPlayer = player.row === rowIndex && player.column === columnIndex;
      const isExit = cell === "E";
      const hasCandy = cell === "C" && !collectedCandy.has(positionKey);
      const tile = document.createElement("button");
      tile.className = "tile path";
      tile.type = "button";
      tile.setAttribute("role", "gridcell");
      tile.dataset.row = rowIndex;
      tile.dataset.column = columnIndex;
      tile.setAttribute("aria-label", isPlayer ? "Ghost, your current position" : isExit ? "Red door, level exit" : hasCandy ? "Candy, collectible" : `Path, row ${rowIndex + 1}, column ${columnIndex + 1}`);
      tile.setAttribute("aria-current", isPlayer ? "location" : "false");
      tile.disabled = completed || (!isPlayer && !isAdjacent(rowIndex, columnIndex));

      if (cell === "S" && !isPlayer) {
        tile.classList.add("start-tile");
        tile.textContent = "IN";
      }

      if (isExit) {
        const door = document.createElement("img");
        door.src = "assets/exit.png";
        door.alt = "";
        door.className = "sprite exit-sprite";
        tile.appendChild(door);
      }

      if (hasCandy) {
        const candy = document.createElement("img");
        candy.src = "assets/candy.png";
        candy.alt = "";
        candy.className = "sprite candy-sprite";
        tile.appendChild(candy);
      }

      if (isPlayer) {
        const ghost = document.createElement("img");
        ghost.src = "assets/ghost.png";
        ghost.alt = "";
        ghost.className = "sprite ghost-sprite";
        tile.appendChild(ghost);
      }

      tile.addEventListener("click", () => movePlayer(rowIndex, columnIndex));
      maze.appendChild(tile);
    });
  });

  if (focusPlayer) {
    maze.querySelector(`[data-row="${player.row}"][data-column="${player.column}"]`)?.focus();
  }
}

function finishLevel() {
  completed = true;
  completedLevels.add(levelIndex);
  updateLevelProgress();

  if (levelIndex === levels.length - 1) {
    congratulationsHeading.textContent = `Congratulations, ${playerName}!`;
    gameLayout.hidden = true;
    lessonPanel.hidden = false;
    cheerAudio.currentTime = 0;
    cheerAudio.play().catch(() => {});
    showConfetti();
  } else {
    gameMessage.textContent = `Level ${levelIndex + 1} cleared! Ready for the next maze?`;
    nextLevelButton.hidden = false;
  }
}

function movePlayer(row, column) {
  if (completed || !isOpen(row, column) || !isAdjacent(row, column)) return;

  player = { row, column };
  moves += 1;
  moveCount.textContent = String(moves).padStart(2, "0");

  const positionKey = `${row},${column}`;
  if (currentLevel.layout[row][column] === "C" && !collectedCandy.has(positionKey)) {
    collectedCandy.add(positionKey);
    updateCandyCount();
    gameMessage.textContent = "Candy collected! Find the red door.";
  } else {
    gameMessage.textContent = "Find every candy, then reach the red door.";
  }

  if (currentLevel.layout[row][column] === "E") {
    if (collectedCandy.size === getLevelCandyCount()) {
      finishLevel();
    } else {
      const remaining = getLevelCandyCount() - collectedCandy.size;
      gameMessage.textContent = `The door is locked. Find ${remaining} more ${remaining === 1 ? "candy" : "candies"}.`;
    }
  }

  renderMaze(true);
}

function startLevel(index) {
  levelIndex = index;
  currentLevel = levels[levelIndex];
  player = { row: 0, column: 0 };
  moves = 0;
  completed = false;
  collectedCandy = new Set();
  moveCount.textContent = "00";
  levelIndicator.textContent = `LEVEL ${levelIndex + 1} / ${levels.length}`;
  levelTitle.textContent = currentLevel.name;
  gameMessage.textContent = "Find every candy, then reach the red door.";
  nextLevelButton.hidden = true;
  updateCandyCount();
  updateLevelProgress();
  renderMaze(true);
}

function restartGame() {
  startLevel(levelIndex);
}

maze.addEventListener("keydown", event => {
  const directions = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1]
  };
  const direction = directions[event.key];
  if (!direction) return;

  event.preventDefault();
  const [rowStep, columnStep] = direction;
  const nextRow = player.row + rowStep;
  const nextColumn = player.column + columnStep;
  if (isOpen(nextRow, nextColumn)) {
    movePlayer(nextRow, nextColumn);
  } else {
    gameMessage.textContent = "Bonk! That's a hedge wall.";
  }
});

resetButton.addEventListener("click", restartGame);
nextLevelButton.addEventListener("click", () => startLevel(levelIndex + 1));
playerForm.addEventListener("submit", event => {
  event.preventDefault();
  playerName = playerNameInput.value.trim();
  if (!playerName) {
    playerNameInput.focus();
    return;
  }

  welcomePanel.hidden = true;
  gameLayout.hidden = false;
  startLevel(0);
});

playAgainButton.addEventListener("click", () => {
  completedLevels = new Set();
  clearConfetti();
  cheerAudio.pause();
  cheerAudio.currentTime = 0;
  lessonPanel.hidden = true;
  gameLayout.hidden = false;
  startLevel(0);
});

musicButton.addEventListener("click", async () => {
  if (music.paused) {
    try {
      await music.play();
      musicButton.setAttribute("aria-pressed", "true");
      musicButton.setAttribute("aria-label", "Pause background music");
      musicButton.querySelector(".music-state").textContent = "ON";
    } catch {
      gameMessage.textContent = "The soundtrack could not be started in this browser.";
    }
  } else {
    music.pause();
    musicButton.setAttribute("aria-pressed", "false");
    musicButton.setAttribute("aria-label", "Play background music");
    musicButton.querySelector(".music-state").textContent = "OFF";
  }
});

let currentLevel;
