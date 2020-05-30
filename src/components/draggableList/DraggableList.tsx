import React, {
  ComponentType,
  memo,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from 'react-native';
import IDragListItem, {flatListDefMargin} from '../../utils/constans';
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
interface IState {
  dragging: boolean;
  dragIndex: number;
  dataList: any[];
  init: boolean;
}
const defaultState: IState = {
  dragging: false,
  dragIndex: -1,
  dataList: [],
  init: false,
};

let translate: Animated.ValueXY = new Animated.ValueXY({x: 0, y: 0});
let listItemRefs: {[x: string]: any} = {};
let measureTimeouts: {[x: string]: number} = {};
let listItemMeasurements: {
  [x: string]: {x: number; y: number; width: number; height: number};
} = {};

const MEASURE_TIMEOUT = Platform.select({
  android: 300,
  ios: 100,
});

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
  const [state, setState] = useState<IState>(defaultState);
  const listRef = useRef<FlatList<IDragListItem>>(null);
  const containerListRef = useRef<View>(null);

  useEffect(() => {
    setState({...state, init: true, dataList: data});
  }, []);

  const onGestureEvent = (event: LongPressGestureHandlerGestureEvent): void => {
    const {x, y} = event.nativeEvent;
    const {dragIndex} = state;
    const index = dragIndex !== -1 ? dragIndex : 0;
    if (horizontal) {
      const xValue = x - itemsWidth[index] / 2;
      const yValue =
        listItemMeasurements[state.dragIndex === -1 ? 0 : state.dragIndex].y;
      translate.setValue({x: xValue, y: yValue});
      onDragActive(x, 0);
    } else {
      if (isInListSize(y, listItemMeasurements, index, flatListHeight)) {
        const yValue =
          y + topOffset - itemsHeight[index] / 2 + flatListDefMargin;
        translate.setValue({
          x: 0,
          y: yValue,
        });
      }
      onDragActive(0, y);
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
      setState({...state, dragging: true, dragIndex: itemIndex});
    }
  };

  const onDragActive = (x: number, y: number): void => {
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
    updateOrder(x, y);
  };

  const onDragEnd = (): void => {
    translate.setValue({x: 0, y: 0});
    setState({...state, dragIndex: -1, dragging: false});
  };

  const updateOrder = (x: number, y: number): void => {
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
      setState({...state, dataList: newData, dragIndex: newIndex});
    }
  };

  const moveList = (direction: number): void => {
    const ref = listRef.current;
    if (scroll && ref) {
      requestAnimationFrame(() => {
        ref.scrollToOffset({
          animated: false,
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
      transform: [...translate.getTranslateTransform()],
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
