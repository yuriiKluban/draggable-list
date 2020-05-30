import IDragListItem, {flatListDefMargin} from './constans';

const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const swapArrayElements = <T>(
  arr: T[],
  indexFrom: number,
  indexTo: number,
): T[] => {
  if (arr.length === 1) return arr;
  arr.splice(indexTo, 1, arr.splice(indexFrom, 1, arr[indexTo])[0]);
  return arr;
};

const xToIndex = (
  x: number,
  listSize: number,
  scrollOffset: number,
  rowWidth: number,
  separatorWidth: number,
): number =>
  Math.min(
    listSize - 1,
    Math.max(0, Math.floor((x + scrollOffset) / (rowWidth + separatorWidth))),
  );

const yToIndex = (
  y: number,
  listSize: number,
  scrollOffset: number,
  rowHeight: number,
  separatorHeight: number,
): number =>
  Math.min(
    listSize - 1,
    Math.max(0, Math.floor((y + scrollOffset) / (rowHeight + separatorHeight))),
  );

const getMinTranslate = (
  y: number,
  listItemMeasurements: {
    [x: string]: {x: number; y: number; width: number; height: number};
  },
  index: number,
): boolean =>
  Math.round(y) >
  Math.round(listItemMeasurements[index].height / 2) + flatListDefMargin;

const getMaxTranslate = (
  y: number,
  listItemMeasurements: {
    [x: string]: {x: number; y: number; width: number; height: number};
  },
  index: number,
  flatListHeight: number,
): boolean =>
  Math.round(y) <
  flatListHeight -
    Math.round(listItemMeasurements[index].height / 2) +
    flatListDefMargin;

const isInListSize = (
  y: number,
  listItemMeasurements: {
    [x: string]: {x: number; y: number; width: number; height: number};
  },
  index: number,
  flatListHeight: number,
): boolean =>
  getMinTranslate(y, listItemMeasurements, index) &&
  getMaxTranslate(y, listItemMeasurements, index, flatListHeight);

const exampleData: IDragListItem[] = [...Array(20)].map(
  (d: IDragListItem, index) => ({
    id: `item-${index}`,
    value: index + 1,
    backgroundColor: getRandomColor(),
  }),
);

export {
  swapArrayElements,
  xToIndex,
  yToIndex,
  getRandomColor,
  isInListSize,
  exampleData,
};
