import {Dimensions, Platform} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const COMPONENT_INITIALIZATION = 'COMPONENT_INITIALIZATION';
const ON_DRAG_START = 'ON_DRAG_START';
const ON_DRAG_END = 'ON_DRAG_END';
const UPDATE_SEQUENCE = 'UPDATE_SEQUENCE';

const flatListDefMargin: number = 4;

const MEASURE_TIMEOUT = Platform.select({
  android: 300,
  ios: 100,
});

export default interface IDragListItem {
  id: string;
  value: number;
  backgroundColor: string;
}

export {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  flatListDefMargin,
  COMPONENT_INITIALIZATION,
  ON_DRAG_START,
  ON_DRAG_END,
  UPDATE_SEQUENCE,
  MEASURE_TIMEOUT,
};
