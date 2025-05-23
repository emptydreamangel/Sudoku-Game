document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const board = document.getElementById("sudoku-board");
  const difficultySelect = document.getElementById("difficulty");
  const newGameBtn = document.getElementById("new-game");
  const checkBtn = document.getElementById("check");
  const solveBtn = document.getElementById("solve");
  const hintBtn = document.getElementById("hint");
  const statusDiv = document.getElementById("status");
  const minutesSpan = document.getElementById("minutes");
  const secondsSpan = document.getElementById("seconds");
  const numButtons = document.querySelectorAll(".num-btn");

  // Game variables
  let selectedCell = null;
  let puzzle = [];
  let solution = [];
  let gameActive = false;
  let timerInterval = null;
  let seconds = 0;
  let minutes = 0;
  let showingCandidates = false;

  // Initialize the game
  createEmptyBoard();
  setupEventListeners();

  // Create the initial empty board
  function createEmptyBoard() {
    board.innerHTML = "";
    for (let i = 0; i < 81; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.index = i;
      board.appendChild(cell);
    }
  }

  // Set up event listeners
  function setupEventListeners() {
    // Cell click event
    board.addEventListener("click", (e) => {
      if (!gameActive) return;

      const cell = e.target.closest(".cell");
      if (!cell || cell.classList.contains("given")) return;

      // Remove previous selection
      if (selectedCell) {
        selectedCell.classList.remove("selected");
        highlightSameNumbers(null);
      }

      selectedCell = cell;
      selectedCell.classList.add("selected");

      // Highlight same numbers
      const num = cell.textContent;
      if (num && num !== "") {
        highlightSameNumbers(num);
      }
    });

    // Keyboard input
    document.addEventListener("keydown", (e) => {
      if (!gameActive) return;

      // Number input (1-9)
      if (e.key >= "1" && e.key <= "9") {
        if (selectedCell && !selectedCell.classList.contains("given")) {
          enterNumber(parseInt(e.key));
          // Add visual feedback
          selectedCell.classList.add("filled-now");
          setTimeout(() => {
            selectedCell.classList.remove("filled-now");
          }, 300);
        }
      }
      // Clear cell with Backspace or Delete
      else if (e.key === "Backspace" || e.key === "Delete") {
        if (selectedCell && !selectedCell.classList.contains("given")) {
          clearCell();
        }
      }
      // Arrow key navigation
      else if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault(); // Prevent scrolling
        navigateWithArrowKeys(e.key);
      }
    });

    // Number pad buttons
    numButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!gameActive || !selectedCell) return;

        const num = parseInt(btn.dataset.num);
        if (num === 0) {
          clearCell();
        } else {
          enterNumber(num);
        }
      });
    });

    // Game control buttons
    newGameBtn.addEventListener("click", startNewGame);
    checkBtn.addEventListener("click", checkSolution);
    solveBtn.addEventListener("click", solvePuzzle);
    hintBtn.addEventListener("click", giveHint);
    document
      .getElementById("show-candidates")
      .addEventListener("click", toggleCandidates);
  }

  // Start a new game
  function startNewGame() {
    const difficulty = difficultySelect.value;
    resetGame();
    generatePuzzle(difficulty);
    renderPuzzle();
    startTimer();
    gameActive = true;
    showingCandidates = false;
    document.getElementById("show-candidates").classList.remove("active");
    statusDiv.textContent = "Game started! Good luck!";
  }

  // Reset the game state
  function resetGame() {
    stopTimer();
    seconds = 0;
    minutes = 0;
    updateTimerDisplay();
    selectedCell = null;
    gameActive = false;
    puzzle = [];
    solution = [];
    createEmptyBoard();
  }

  // Generate a Sudoku puzzle with the specified difficulty
  function generatePuzzle(difficulty) {
    // First, generate a solved puzzle
    solution = generateSolvedGrid();

    // Then, create a puzzle by removing numbers based on difficulty
    puzzle = [...solution];

    let cellsToRemove;
    switch (difficulty) {
      case "easy":
        cellsToRemove = 30; // 51 clues
        break;
      case "medium":
        cellsToRemove = 45; // 36 clues
        break;
      case "hard":
        cellsToRemove = 55; // 26 clues
        break;
      default:
        cellsToRemove = 45;
    }

    // Randomly remove numbers
    const indices = Array.from({ length: 81 }, (_, i) => i);
    shuffleArray(indices);

    for (let i = 0; i < cellsToRemove; i++) {
      const index = indices[i];
      puzzle[index] = 0;
    }
  }

  // Generate a solved Sudoku grid
  function generateSolvedGrid() {
    // Start with an empty grid
    const grid = Array(81).fill(0);

    // Fill the grid using backtracking
    solveSudoku(grid);

    return grid;
  }

  // Solve a Sudoku grid using backtracking
  function solveSudoku(grid) {
    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0) {
        const row = Math.floor(i / 9);
        const col = i % 9;

        // Try each number 1-9
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(nums);

        for (const num of nums) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[i] = num;

            if (solveSudoku(grid)) {
              return true;
            }

            grid[i] = 0; // Backtrack
          }
        }

        return false; // No valid number found
      }
    }

    return true; // Grid is filled
  }

  // Check if a number can be placed at a position
  function isValidPlacement(grid, row, col, num) {
    // Check row
    for (let c = 0; c < 9; c++) {
      if (grid[row * 9 + c] === num) {
        return false;
      }
    }

    // Check column
    for (let r = 0; r < 9; r++) {
      if (grid[r * 9 + col] === num) {
        return false;
      }
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[(boxRow + r) * 9 + (boxCol + c)] === num) {
          return false;
        }
      }
    }

    return true;
  }

  // Render the puzzle on the board
  function renderPuzzle() {
    const cells = board.querySelectorAll(".cell");

    cells.forEach((cell, index) => {
      const value = puzzle[index];

      if (value !== 0) {
        cell.textContent = value;
        cell.classList.add("given");
      } else {
        cell.textContent = "";
        cell.classList.remove("given");
      }

      cell.classList.remove("selected", "error", "hint", "same-number");
    });
  }

  // Enter a number in the selected cell
  function enterNumber(num) {
    if (!selectedCell) return;

    const index = parseInt(selectedCell.dataset.index);
    const row = Math.floor(index / 9);
    const col = index % 9;

    // Check if the number is valid
    const isValid = isValidPlacement(getCurrentGrid(), row, col, num);

    selectedCell.textContent = num;

    if (!isValid) {
      selectedCell.classList.add("error");
    } else {
      selectedCell.classList.remove("error");
    }

    highlightSameNumbers(num);

    // Update candidates display if showing
    if (showingCandidates) {
      updateCandidatesDisplay();
    }

    // Check if the puzzle is complete
    if (isBoardFilled()) {
      if (checkSolution(true)) {
        gameWon();
      }
    }
  }

  // Clear the selected cell
  function clearCell() {
    if (!selectedCell) return;

    selectedCell.textContent = "";
    selectedCell.classList.remove("error", "hint");
    highlightSameNumbers(null);

    // Update candidates display if showing
    if (showingCandidates) {
      updateCandidatesDisplay();
    }
  }

  // Highlight cells with the same number
  function highlightSameNumbers(num) {
    const cells = board.querySelectorAll(".cell");

    cells.forEach((cell) => {
      cell.classList.remove("same-number");

      if (num && cell.textContent === num.toString()) {
        cell.classList.add("same-number");
      }
    });
  }

  // Get the current state of the grid
  function getCurrentGrid() {
    const grid = Array(81).fill(0);
    const cells = board.querySelectorAll(".cell");

    cells.forEach((cell, index) => {
      const value = cell.textContent;
      grid[index] = value ? parseInt(value) : 0;
    });

    return grid;
  }

  // Check if the board is completely filled
  function isBoardFilled() {
    const cells = board.querySelectorAll(".cell");
    return Array.from(cells).every((cell) => cell.textContent !== "");
  }

  // Check the current solution
  function checkSolution(silent = false) {
    const currentGrid = getCurrentGrid();

    // Check if the grid is valid
    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      const value = currentGrid[i];

      if (value === 0) continue;

      // Temporarily remove the value to check if it's valid
      currentGrid[i] = 0;
      const isValid = isValidPlacement(currentGrid, row, col, value);
      currentGrid[i] = value;

      if (!isValid) {
        if (!silent) {
          statusDiv.textContent = "There are errors in your solution!";
        }
        return false;
      }
    }

    // Check if the solution matches the expected solution
    const isComplete = isBoardFilled();

    if (isComplete) {
      if (!silent) {
        statusDiv.textContent = "Congratulations! Your solution is correct!";
      }
      return true;
    } else {
      if (!silent) {
        statusDiv.textContent =
          "So far so good, but the puzzle is not complete yet!";
      }
      return false;
    }
  }

  // Solve the puzzle
  function solvePuzzle() {
    if (!gameActive) return;

    // If showing candidates, turn it off
    if (showingCandidates) {
      showingCandidates = false;
      document.getElementById("show-candidates").classList.remove("active");
      clearCandidatesDisplay();
    }

    const cells = board.querySelectorAll(".cell");

    cells.forEach((cell, index) => {
      if (!cell.classList.contains("given")) {
        cell.textContent = solution[index];
        cell.classList.remove(
          "error",
          "hint",
          "selected",
          "same-number",
          "show-candidates"
        );
      }
    });

    gameActive = false;
    stopTimer();
    statusDiv.textContent = "Puzzle solved!";
  }

  // Give a hint
  function giveHint() {
    if (
      !gameActive ||
      !selectedCell ||
      selectedCell.classList.contains("given")
    ) {
      // If no cell is selected, find a random empty cell
      const emptyCells = Array.from(board.querySelectorAll(".cell")).filter(
        (cell) => !cell.classList.contains("given") && cell.textContent === ""
      );

      if (emptyCells.length === 0) return;

      // Select a random empty cell
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      selectedCell = emptyCells[randomIndex];

      // Remove previous selection
      const prevSelected = board.querySelector(".cell.selected");
      if (prevSelected) {
        prevSelected.classList.remove("selected");
      }

      selectedCell.classList.add("selected");
    }

    const index = parseInt(selectedCell.dataset.index);
    const correctValue = solution[index];

    selectedCell.textContent = correctValue;
    selectedCell.classList.add("hint");
    selectedCell.classList.remove("error");

    highlightSameNumbers(correctValue);

    // Check if the puzzle is complete
    if (isBoardFilled()) {
      if (checkSolution(true)) {
        gameWon();
      }
    }
  }

  // Game won
  function gameWon() {
    gameActive = false;
    stopTimer();
    statusDiv.textContent = `Congratulations! You solved the puzzle in ${formatTime(
      minutes,
      seconds
    )}!`;
  }

  // Timer functions
  function startTimer() {
    stopTimer();
    seconds = 0;
    minutes = 0;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
      }
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    minutesSpan.textContent = padZero(minutes);
    secondsSpan.textContent = padZero(seconds);
  }

  function padZero(num) {
    return num.toString().padStart(2, "0");
  }

  function formatTime(min, sec) {
    return `${padZero(min)}:${padZero(sec)}`;
  }

  // Utility function to shuffle an array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Function to navigate the grid using arrow keys
  function navigateWithArrowKeys(key) {
    // If no cell is selected, select the first non-given cell
    if (!selectedCell) {
      const firstEmptyCell =
        Array.from(board.querySelectorAll(".cell")).find(
          (cell) => !cell.classList.contains("given")
        ) || board.querySelector(".cell");

      if (firstEmptyCell) {
        selectedCell = firstEmptyCell;
        selectedCell.classList.add("selected");
        return;
      }
    }

    const index = parseInt(selectedCell.dataset.index);
    const currentRow = Math.floor(index / 9);
    const currentCol = index % 9;

    // Calculate new row and column based on arrow key
    let newRow = currentRow;
    let newCol = currentCol;

    switch (key) {
      case "ArrowUp":
        newRow = Math.max(0, currentRow - 1);
        break;
      case "ArrowDown":
        newRow = Math.min(8, currentRow + 1);
        break;
      case "ArrowLeft":
        newCol = Math.max(0, currentCol - 1);
        break;
      case "ArrowRight":
        newCol = Math.min(8, currentCol + 1);
        break;
    }

    // Calculate new index
    const newIndex = newRow * 9 + newCol;

    // Find and select the new cell
    if (newIndex !== index) {
      const cells = board.querySelectorAll(".cell");
      const newCell = cells[newIndex];

      if (newCell) {
        // Remove previous selection
        selectedCell.classList.remove("selected");

        // Update selected cell
        selectedCell = newCell;
        selectedCell.classList.add("selected");

        // Highlight same numbers if the cell has a number
        const num = selectedCell.textContent;
        if (num && num !== "") {
          highlightSameNumbers(num);
        } else {
          highlightSameNumbers(null);
        }
      }
    }
  }

  // Function to calculate candidates for each empty cell
  function calculateCandidates() {
    const candidates = [];
    const currentGrid = getCurrentGrid();

    // Initialize candidates array for each cell
    for (let row = 0; row < 9; row++) {
      candidates[row] = [];
      for (let col = 0; col < 9; col++) {
        const index = row * 9 + col;
        candidates[row][col] = [];

        // If the cell is not empty, no candidates
        if (currentGrid[index] !== 0) {
          continue;
        }

        // Check each number 1-9
        for (let num = 1; num <= 9; num++) {
          // Temporarily place the number
          currentGrid[index] = num;
          if (isValidPlacement(currentGrid, row, col, num)) {
            candidates[row][col].push(num);
          }
          // Remove the number
          currentGrid[index] = 0;
        }
      }
    }

    return candidates;
  }

  // Function to toggle candidates display
  function toggleCandidates() {
    showingCandidates = !showingCandidates;
    const button = document.getElementById("show-candidates");

    if (showingCandidates) {
      button.classList.add("active");
      updateCandidatesDisplay();
    } else {
      button.classList.remove("active");
      clearCandidatesDisplay();
    }
  }

  // Function to update candidates display
  function updateCandidatesDisplay() {
    if (!gameActive || !showingCandidates) return;

    const candidates = calculateCandidates();
    const cells = board.querySelectorAll(".cell");

    cells.forEach((cell, index) => {
      const row = Math.floor(index / 9);
      const col = index % 9;

      // Skip filled cells
      if (cell.textContent !== "") return;

      // Create candidates container
      const candidatesContainer = document.createElement("div");
      candidatesContainer.className = "candidates";

      // Add each candidate number
      for (let num = 1; num <= 9; num++) {
        const span = document.createElement("span");
        if (candidates[row][col].includes(num)) {
          span.textContent = num;
        }
        candidatesContainer.appendChild(span);
      }

      // Clear existing content and add candidates
      cell.textContent = "";
      cell.classList.add("show-candidates");
      cell.appendChild(candidatesContainer);
    });
  }

  // Function to clear candidates display
  function clearCandidatesDisplay() {
    const cells = board.querySelectorAll(".cell");

    cells.forEach((cell) => {
      cell.classList.remove("show-candidates");
      const candidatesContainer = cell.querySelector(".candidates");

      if (candidatesContainer) {
        cell.removeChild(candidatesContainer);
      }

      // Restore the original number if it exists in the current state
      const index = parseInt(cell.dataset.index);
      const currentGrid = getCurrentGrid();
      const value = currentGrid[index];

      if (value !== 0) {
        cell.textContent = value;
      } else {
        cell.textContent = "";
      }
    });
  }
});
