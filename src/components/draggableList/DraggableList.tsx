import React, {
  ComponentType,
  memo,
  ReactElement,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import IDragListItem, {
  COMPONENT_INITIALIZATION,
  flatListDefMargin,
  isIos,
  MEASURE_TIMEOUT,
  ON_DRAG_ACTIVE,
  ON_DRAG_END,
  ON_DRAG_START,
  UPDATE_SEQUENCE,
} from '../../utils/constans';
import {
  GestureHandlerStateChangeNativeEvent,
  LongPressGestureHandler,
  LongPressGestureHandlerEventExtra,
  LongPressGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import {
  isInListSize,
  swapArrayElements,
  xToIndex,
  yToIndex,
} from '../../utils/functions';
import styles from './styles';
import {initialState, reducer} from './reducer';

interface Props {
  horizontal?: boolean;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  data: any[];
  renderItem: any;
  keyExtractor: (item: any, index: number) => string;
  ItemSeparatorComponent?: ComponentType<any> | null;
}
const defaultProps: Props = {
  data: [],
  horizontal: false,
  renderItem: () => <></>,
  keyExtractor: (item: any, index: number) => `${index}`,
};

const {Value} = Animated;

let translateX: Animated.Value<number> = new Value(0);
let translateY: Animated.Value<number> = new Value(0);
let listItemRefs: {[x: string]: any} = {};
let measureTimeouts: {[x: string]: number} = {};
let listItemMeasurements: {
  [x: string]: {x: number; y: number; width: number; height: number};
} = {};

let scroll: boolean = false;
let flatListWidth: number = 0;
let flatListHeight: number = 0;
let scrollOffset: number = 0;
let topOffset: number = 0;
let separatorWidth: number = 0;
let separatorHeight: number = 0;
let itemsWidth: any = {};
let itemsHeight: any = {};

const DraggableListComponent = ({
  onScroll,
  data,
  renderItem,
  keyExtractor,
  ItemSeparatorComponent,
  horizontal,
}: Props): ReactElement => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const listRef = useRef<FlatList<IDragListItem>>(null);
  const containerListRef = useRef<View>(null);

  useEffect(() => {
    dispatch({type: COMPONENT_INITIALIZATION, payload: data});
  }, []);

  const onGestureEvent = (event: LongPressGestureHandlerGestureEvent): void => {
    const {x, y} = event.nativeEvent;
    const {dragIndex} = state;
    const index = dragIndex !== -1 ? dragIndex : 0;
    if (horizontal) {
      const xValue = x - itemsWidth[index] / 2;
      const yValue =
        listItemMeasurements[state.dragIndex === -1 ? 0 : state.dragIndex].y;
      translateX.setValue(xValue);
      translateY.setValue(isIos ? yValue : 0);
      onDragActive(x, 0);
    } else {
      if (isInListSize(y, listItemMeasurements, index, flatListHeight)) {
        const yValue =
          y + topOffset - itemsHeight[index] / 2 + flatListDefMargin;
        translateX.setValue(0);
        translateY.setValue(yValue);
        onDragActive(0, y);
      }
    }
  };

  const onHandlerStateChange = ({
    nativeEvent,
  }: {
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      LongPressGestureHandlerEventExtra;
  }): void => {
    switch (nativeEvent.state) {
      case State.ACTIVE:
        onDragStart(nativeEvent);
        break;
      case State.CANCELLED:
      case State.END:
      case State.FAILED:
        onDragEnd();
        break;
      default:
        break;
    }
  };

  const onDragStart = (
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      LongPressGestureHandlerEventExtra,
  ): void => {
    const {x, y} = nativeEvent;
    let itemIndex: number;
    if (horizontal) {
      itemIndex = xToIndex(
        x,
        state.dataList.length,
        scrollOffset,
        listItemMeasurements[state.dragIndex === -1 ? 0 : state.dragIndex]
          .width,
        separatorWidth,
      );
    } else {
      itemIndex = yToIndex(
        y,
        state.dataList.length,
        scrollOffset,
        listItemMeasurements[state.dragIndex === -1 ? 0 : state.dragIndex]
          .height,
        separatorHeight,
      );
    }
    if (itemIndex !== -1 && !state.dragging) {
      dispatch({type: ON_DRAG_START, payload: itemIndex});
    }
  };

  const onDragActive = (x: number, y: number): void => {
    !isIos && !state.dragging && dispatch({type: ON_DRAG_ACTIVE});
    if (!scroll) {
      const {width, height} = listItemMeasurements[state.dragIndex];
      if (horizontal) {
        if (x + width > flatListWidth) {
          scroll = true;
          moveList(x);
        }
        if (x < width && scrollOffset) {
          scroll = true;
          moveList(x);
        }
      } else {
        if (y + height > flatListHeight) {
          scroll = true;
          moveList(y);
        }
        if (y < height && scrollOffset) {
          scroll = true;
          moveList(y);
        }
      }
    } else {
      scroll = false;
    }
    updateSequence(x, y);
  };

  const onDragEnd = (): void => {
    translateX.setValue(0);
    translateY.setValue(0);
    dispatch({type: ON_DRAG_END});
  };

  const updateSequence = (x: number, y: number): void => {
    const {dragIndex, dataList} = state;
    const index = dragIndex !== -1 ? dragIndex : 0;
    let newIndex: number;
    if (horizontal) {
      newIndex = xToIndex(
        x,
        state.dataList.length,
        scrollOffset,
        listItemMeasurements[index].width,
        separatorWidth,
      );
    } else {
      newIndex = yToIndex(
        y,
        state.dataList.length,
        scrollOffset,
        listItemMeasurements[index].height,
        separatorHeight,
      );
    }
    if (newIndex !== -1 && newIndex !== dragIndex) {
      const newData = [...swapArrayElements(dataList, dragIndex, newIndex)];
      dispatch({type: UPDATE_SEQUENCE, payload: {newData, newIndex}});
    }
  };

  const moveList = (direction: number): void => {
    const ref = listRef.current;
    if (scroll && ref) {
      requestAnimationFrame(() => {
        ref.scrollToOffset({
          animated: true,
          offset: direction,
        });
      });
    }
  };

  const setListItemRef = (key: string): ((ref: any) => void) => (
    ref: any,
  ): void => {
    listItemRefs[key] = ref;
    measureListItem(key);
  };

  const measureListItem = (key: string): void => {
    if (measureTimeouts[key]) {
      clearTimeout(measureTimeouts[key]);
    }
    measureTimeouts[key] = setTimeout(_measureListItem(key), MEASURE_TIMEOUT);
  };

  const _measureListItem = (key: string): (() => void) => () => {
    const element = listItemRefs[key];
    if (!element || state.dragging) {
      return;
    }
    element.measureInWindow(_onItemMeasured(key));
  };

  const _onItemMeasured = (key: string) => (
    x: number,
    y: number,
    width: number,
    height: number,
  ): void => {
    listItemMeasurements[key] = {x, y, width, height};
  };

  const measureAll = (): void => {
    const itemKeys = Object.keys(listItemRefs);
    itemKeys.forEach(measureListItem);
  };

  const onLayoutList = (event: LayoutChangeEvent): void => {
    const {width, height} = event.nativeEvent.layout;
    horizontal ? (flatListWidth = width) : (flatListHeight = height);
  };

  const onLayoutSeparator = (event: LayoutChangeEvent): void => {
    const {width, height} = event.nativeEvent.layout;
    if (!separatorWidth && horizontal) {
      separatorWidth = width;
    }
    if (!separatorHeight && !horizontal) {
      separatorHeight = height;
    }
  };

  const onListItemLayout = (event: LayoutChangeEvent, index: number): void => {
    const {width, height} = event.nativeEvent.layout;
    horizontal ? (itemsWidth[index] = width) : (itemsHeight[index] = height);
  };

  const onContainerLayout = (): void => {
    containerListRef.current &&
      containerListRef.current.measureInWindow((_x: number, y: number) => {
        topOffset = y;
      });
  };

  const onScrollHandler = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ): void => {
    const {x, y} = event.nativeEvent.contentOffset;
    horizontal ? (scrollOffset = x) : (scrollOffset = y);
    onScroll && onScroll(event);
  };

  const renderHoverDraggingElement = (): ReactElement => {
    const {dragIndex, dataList} = state;
    const item = dataList[dragIndex];
    const {height, width} = listItemMeasurements[dragIndex];
    const style = {
      ...styles.dragWrapper,
      height,
      width,
      transform: [{translateX}, {translateY}],
    };
    return (
      <Animated.View
        style={style}
        shouldRasterizeIOS={scroll}
        renderToHardwareTextureAndroid={scroll}>
        {renderItem && renderItem({item, index: dragIndex})}
      </Animated.View>
    );
  };

  const renderItemComponent = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }): ReactElement => {
    return (
      <View
        onLayout={(event) => onListItemLayout(event, index)}
        ref={setListItemRef(`${index}`)}>
        {state.dragging && state.dragIndex === index ? (
          <View
            style={{
              ...styles.emptyWrapper,
              width: itemsWidth[state.dragIndex],
              height: itemsHeight[state.dragIndex],
            }}
          />
        ) : (
          renderItem({item, index})
        )}
      </View>
    );
  };

  const renderSeparator = (): ReactElement => (
    <View onLayout={onLayoutSeparator}>
      {ItemSeparatorComponent && <ItemSeparatorComponent />}
    </View>
  );

  const {dragging, dataList, init} = state;
  if (!init) return <></>;

  return (
    <>
      <LongPressGestureHandler
        maxDist={Number.MAX_SAFE_INTEGER}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        minDurationMs={700}>
        <View
          ref={containerListRef}
          onLayout={onContainerLayout}
          style={styles.container}>
          <FlatList
            horizontal={horizontal}
            onScroll={onScrollHandler}
            ref={listRef}
            data={dataList}
            renderItem={renderItemComponent}
            scrollEventThrottle={10}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={renderSeparator}
            onMomentumScrollEnd={measureAll}
            onLayout={onLayoutList}
            initialNumToRender={dataList.length}
            windowSize={15}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </LongPressGestureHandler>
      {dragging && renderHoverDraggingElement()}
    </>
  );
};

DraggableListComponent.defaultProps = defaultProps;
const DraggableList = memo(DraggableListComponent);

export default DraggableList;
