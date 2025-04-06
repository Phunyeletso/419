const player1InitialState = [
  {id: 'A1', pos: 0, travelCount: 0},
  {id: 'A2', pos: 0, travelCount: 0},
  {id: 'A3', pos: 0, travelCount: 0},
  {id: 'A4', pos: 0, travelCount: 0},
];
const player2InitialState = [
  {id: 'B1', pos: 0, travelCount: 0},
  {id: 'B2', pos: 0, travelCount: 0},
  {id: 'B3', pos: 0, travelCount: 0},
  {id: 'B4', pos: 0, travelCount: 0},
];
const player3InitialState = [
  {id: 'C1', pos: 0, travelCount: 0},
  {id: 'C2', pos: 0, travelCount: 0},
  {id: 'C3', pos: 0, travelCount: 0},
  {id: 'C4', pos: 0, travelCount: 0},
];
const player4InitialState = [
  {id: 'D1', pos: 0, travelCount: 0},
  {id: 'D2', pos: 0, travelCount: 0},
  {id: 'D3', pos: 0, travelCount: 0},
  {id: 'D4', pos: 0, travelCount: 0},
];

export const initialState = {
  // Player pieces data
  player1: player1InitialState,
  player2: player2InitialState,
  player3: player3InitialState,
  player4: player4InitialState,
  
  // Game state
  chancePlayer: 1,
  diceNo: 1,
  isDiceRolled: false,
  pileSelectionPlayer: -1,
  cellSelectionPlayer: -1,
  touchDiceBlock: false,
  currentPositions: [],
  fireworks: false,
  winner: null,
  
  // Enhanced gameplay features
  consecutiveSixes: 0,  // Track consecutive sixes for rule enforcement
  gameStartTime: Date.now(),
  gameEndTime: null,
  turnCount: 0,
  
  // Game statistics for analytics
  diceHistory: [],  // Track dice rolls
  moveHistory: [],  // Track piece movements
  captures: [],     // Track piece captures
  
  // Game settings
  settings: {
    difficulty: 'medium',  // easy, medium, hard
    playerCount: 4,        // 2, 3, or 4
    enableSounds: true,    // sound effects on/off
    aiDelay: 1000,         // milliseconds delay for AI moves
    theme: 'dark',         // light or dark theme
  }
};
