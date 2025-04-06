import { Provider } from 'react-redux';
import { persistor, store } from './src/redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import Navigation from './src/navigation/Navigation';
import { WalletProvider } from './src/contexts/WalletContext';

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <WalletProvider>
          <Navigation />
        </WalletProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
