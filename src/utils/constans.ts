import {Dimensions} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const flatListDefMargin: number = 4;

export default interface IDragListItem {
  id: string;
  value: number;
  backgroundColor: string;
}

export {SCREEN_WIDTH, SCREEN_HEIGHT, flatListDefMargin};
