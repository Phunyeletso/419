import { combineReducers } from 'redux';
import gameSlice from './reducers/gameSlice';
import walletSlice from './reducers/walletSlice';  // Import the wallet slice

const rootReducer = combineReducers({
  game: gameSlice,
  wallet: walletSlice, // Add wallet slice here
});

export default rootReducer;

