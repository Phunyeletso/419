import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectCurrentPositions } from '../redux/reducers/gameSelectors';
import { BackgroundImage } from '../helpers/BackgroundImage';
import { Colors } from '../constants/Colors';
import { Plot1Data, Plot2Data, Plot3Data, Plot4Data } from '../helpers/PlotData';

const allPositions = [...Plot1Data, ...Plot2Data, ...Plot3Data, ...Plot4Data];

// Simple grid mapping for positions → coordinates
const tokenGridMap = {};
allPositions.forEach((pos, idx) => {
  const row = Math.floor(idx / 6);
  const col = idx % 6;
  tokenGridMap[pos] = {
    top: 80 + row * 40,
    left: 80 + col * 40,
  };
});

const getTokenPositionStyle = (pos) => {
  const size = 24;
  const coords = tokenGridMap[pos];
  if (!coords) return null;
  return {
    position: 'absolute',
    width: size,
    height: size,
    ...coords,
  };
};

const getPlayerColor = (playerNo) => {
  switch (playerNo) {
    case 1: return Colors.red;
    case 2: return Colors.green;
    case 3: return Colors.yellow;
    case 4: return Colors.blue;
    default: return Colors.red;
  }
};

const TokenOnBoard = () => {
  const plottedPieces = useSelector(selectCurrentPositions);

  return plottedPieces.map(({ id, pos, playerNo }) => {
    const image = BackgroundImage.GetImage(getPlayerColor(playerNo));
    const style = getTokenPositionStyle(pos);
    if (!style || !image) return null;

    return (
      <Image
        key={id}
        source={image}
        style={[styles.token, style]}
      />
    );
  });
};

const styles = StyleSheet.create({
  token: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    zIndex: 10,
  },
});

export default TokenOnBoard;
