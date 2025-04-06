import { createSlice } from '@reduxjs/toolkit';
import { initialState } from './initialState';

export const gameSlice = createSlice({
  name: 'game',
  initialState: initialState,
  reducers: {
    resetGame: () => initialState,
    
    updateDiceNo: (state, action) => {
      state.diceNo = action.payload.diceNo;
      state.isDiceRolled = true;
      
      // Record roll history for statistics
      state.diceHistory.push({
        player: state.chancePlayer,
        roll: action.payload.diceNo,
        timestamp: Date.now()
      });
    },
    
    updatePlayerChance: (state, action) => {
      // If player gets a 6, they get an extra turn
      if (state.diceNo === 6 && state.chancePlayer === action.payload.chancePlayer) {
        state.consecutiveSixes += 1;
        
        // If player rolls three consecutive 6s, their turn is forfeited
        if (state.consecutiveSixes >= 3) {
          state.consecutiveSixes = 0;
          let nextPlayer = state.chancePlayer + 1;
          if (nextPlayer > 4) nextPlayer = 1;
          state.chancePlayer = nextPlayer;
        }
      } else {
        state.consecutiveSixes = 0;
        state.chancePlayer = action.payload.chancePlayer;
      }
      
      state.touchDiceBlock = false;
      state.isDiceRolled = false;
      
      // Track turn count for game statistics
      state.turnCount += 1;
    },
    
    updatePlayerPieceValue: (state, action) => {
      const { playerNo, pieceId, pos, travelCount } = action.payload;
      const playerPieces = state[playerNo];
      const piece = playerPieces.find(p => p.id === pieceId);
      state.pileSelectionPlayer = -1;
      
      if (piece) {
        // Record the previous position for animation and logic
        const previousPos = piece.pos;
        piece.pos = pos;
        piece.travelCount = travelCount;
        
        // Track piece movement for statistics
        state.moveHistory.push({
          pieceId,
          playerNo,
          from: previousPos,
          to: pos,
          timestamp: Date.now()
        });
        
        // Update current positions tracking
        const currentPositionIndex = state.currentPositions.findIndex(
          p => p.id === pieceId,
        );

        if (pos === 0) {
          if (currentPositionIndex !== -1) {
            state.currentPositions.splice(currentPositionIndex, 1);
          }
        } else {
          if (currentPositionIndex !== -1) {
            state.currentPositions[currentPositionIndex] = {
              id: pieceId,
              pos,
              playerNo, // Add playerNo for better tracking
            };
          } else {
            state.currentPositions.push({
              id: pieceId,
              pos,
              playerNo, // Add playerNo for better tracking
            });
          }
        }
        
        // Check if the player has won (all 4 pieces at position 57)
        const allPiecesHome = playerPieces.every(p => p.pos === 57);
        if (allPiecesHome) {
          state.winner = parseInt(playerNo.replace('player', ''));
        }
      }
    },
    
    capturePiece: (state, action) => {
      const { capturingPlayer, capturedPieceId, capturedPlayerNo } = action.payload;
      const capturedPlayerPieces = state[capturedPlayerNo];
      const piece = capturedPlayerPieces.find(p => p.id === capturedPieceId);
      
      if (piece) {
        // Reset the captured piece to start position
        piece.pos = 0;
        piece.travelCount = 0;
        
        // Remove from current positions
        const currentPositionIndex = state.currentPositions.findIndex(
          p => p.id === capturedPieceId
        );
        if (currentPositionIndex !== -1) {
          state.currentPositions.splice(currentPositionIndex, 1);
        }
        
        // Add to captures statistics
        state.captures.push({
          capturingPlayer,
          capturedPieceId,
          capturedPlayerNo,
          timestamp: Date.now()
        });
      }
    },
    
    disableTouch: state => {
      state.touchDiceBlock = true;
      state.cellSelectionPlayer = -1;
      state.pileSelectionPlayer = -1;
    },
    
    unfreezeDice: state => {
      state.touchDiceBlock = false;
      state.isDiceRolled = false;
    },
    
    enablePileSelection: (state, action) => {
      state.touchDiceBlock = true;
      state.pileSelectionPlayer = action.payload.playerNo;
    },
    
    enableCellSelection: (state, action) => {
      state.touchDiceBlock = true;
      state.cellSelectionPlayer = action.payload.playerNo;
    },
    
    updateFireworks: (state, action) => {
      state.fireworks = action.payload;
    },
    
    announceWinner: (state, action) => {
      state.winner = action.payload;
      // Record game end time
      state.gameEndTime = Date.now();
    },
    
    // New actions for enhanced functionality
    setGameSettings: (state, action) => {
      const { difficulty, playerCount, enableSounds } = action.payload;
      state.settings = {
        ...state.settings,
        difficulty: difficulty || state.settings.difficulty,
        playerCount: playerCount || state.settings.playerCount,
        enableSounds: enableSounds !== undefined ? enableSounds : state.settings.enableSounds
      };
    },
    
    updateAIDelay: (state, action) => {
      state.settings.aiDelay = action.payload;
    },
  },
});

export const {
  resetGame,
  announceWinner,
  updateFireworks,
  enableCellSelection,
  updateDiceNo,
  enablePileSelection,
  updatePlayerChance,
  updatePlayerPieceValue,
  disableTouch,
  unfreezeDice,
  capturePiece,
  setGameSettings,
  updateAIDelay,
} = gameSlice.actions;

export default gameSlice.reducer;
