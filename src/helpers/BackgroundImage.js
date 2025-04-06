import { Colors } from '../constants/Colors';

export class BackgroundImage {
  static images = [
    {
      name: Colors.green,
      image: require('../assets/images/piles/green.png'),
    },
    {
      name: Colors.red,
      image: require('../assets/images/piles/red.png'),
    },
    {
      name: Colors.yellow,
      image: require('../assets/images/piles/yellow.png'),
    },
    {
      name: Colors.blue,
      image: require('../assets/images/piles/blue.png'),
    },
  ];

  static GetImage = (name) => {
    const found = BackgroundImage.images.find((e) => e.name === name);
    return found ? found.image : null;
  };
}
