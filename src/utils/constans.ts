import {Dimensions} from 'react-native';
import {getRandomColor} from './functions';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const flatListDefMargin: number = 4;

export default interface IDragListItem {
  id: string;
  value: number;
  backgroundColor: string;
}

const exampleData: IDragListItem[] = [...Array(20)].map(
  (d: IDragListItem, index) => ({
    id: `item-${index}`,
    value: index + 1,
    backgroundColor: getRandomColor(),
  }),
);

export {SCREEN_WIDTH, SCREEN_HEIGHT, exampleData, flatListDefMargin};
