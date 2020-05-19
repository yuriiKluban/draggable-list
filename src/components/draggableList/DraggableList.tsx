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
  TapGestureHandler,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import {isInListSize, swapArrayElements, yToIndex} from '../../utils/functions';
import styles from './styles';

interface Props {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  data: any[];
  renderItem: any;
  keyExtractor: (item: any, index: number) => string;
  ItemSeparatorComponent?: ComponentType<any> | null;
  onItemPress?: (item: any) => void;
}
const defaultProps: Props = {
  data: [],
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
let flatListHeight: number = 0;
let scrollOffset: number = 0;
let topOffset: number = 0;
let separatorHeight: number = 0;
let itemsHeight: any = {};

const DraggableListComponent = ({
  onScroll,
  data,
  renderItem,
  keyExtractor,
  ItemSeparatorComponent,
  onItemPress,
}: Props): ReactElement => {
  const [state, setState] = useState<IState>(defaultState);
  const listRef = useRef<FlatList<IDragListItem>>(null);
  const containerListRef = useRef<View>(null);

  useEffect(() => {
    setState({...state, init: true, dataList: data});
  }, []);

  const onGestureEvent = (event: LongPressGestureHandlerGestureEvent): void => {
    const {y} = event.nativeEvent;
    const {dragIndex} = state;
    const x: number = 0;
    const index = dragIndex !== -1 ? dragIndex : 0;
    if (isInListSize(y, listItemMeasurements, index, flatListHeight)) {
      const yValue = y + topOffset - itemsHeight[index] / 2 + flatListDefMargin;
      translate.setValue({x, y: yValue});
    }
    onDragActive(x, y);
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

  const onSingleTap = (
    event: TapGestureHandlerStateChangeEvent,
    item: any,
  ): void => {
    if (event.nativeEvent.state === State.ACTIVE) {
      onItemPress && onItemPress(item);
    }
  };

  const onDragStart = (
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      LongPressGestureHandlerEventExtra,
  ): void => {
    const {y} = nativeEvent;
    const itemIndex = yToIndex(
      y,
      state.dataList.length,
      scrollOffset,
      topOffset,
      listItemMeasurements[state.dragIndex === -1 ? 0 : state.dragIndex].height,
      separatorHeight,
    );
    if (itemIndex !== -1 && !state.dragging) {
      setState({...state, dragging: true, dragIndex: itemIndex});
    }
  };

  const onDragActive = (x: number, y: number): void => {
    if (!scroll) {
      const {height} = listItemMeasurements[state.dragIndex];
      if (y + height > flatListHeight) {
        scroll = true;
        moveList(y);
      }
      if (y < height && scrollOffset) {
        scroll = true;
        moveList(y);
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
    const newIndex = yToIndex(
      y,
      state.dataList.length,
      scrollOffset,
      topOffset,
      listItemMeasurements[index].height,
      separatorHeight,
    );
    if (newIndex !== -1 && newIndex !== dragIndex) {
      const newData = [...swapArrayElements(dataList, dragIndex, newIndex)];
      console.log(newData);
      setState({...state, dataList: newData, dragIndex: newIndex});
    }
  };

  const moveList = (y: number): void => {
    const ref = listRef.current;
    if (scroll && ref) {
      requestAnimationFrame(() => {
        ref.scrollToOffset({
          animated: true,
          offset: y,
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

  const onLayoutList = (event: LayoutChangeEvent): number =>
    (flatListHeight = event.nativeEvent.layout.height);

  const onLayoutSeparator = (event: LayoutChangeEvent): void => {
    if (!separatorHeight) {
      separatorHeight = event.nativeEvent.layout.height;
    }
  };

  const onListItemLayout = (event: LayoutChangeEvent, index: number): number =>
    (itemsHeight[index] = event.nativeEvent.layout.height);

  const onContainerLayout = (): void => {
    containerListRef.current &&
      containerListRef.current.measureInWindow((_x: number, y: number) => {
        topOffset = y;
      });
  };

  const onScrollHandler = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ): void => {
    scrollOffset = event.nativeEvent.contentOffset.y;
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
      <TapGestureHandler
        onHandlerStateChange={(event) => onSingleTap(event, item)}>
        <View
          onLayout={(event) => onListItemLayout(event, index)}
          ref={setListItemRef(`${index}`)}
          collapsable={false}>
          {state.dragging && state.dragIndex === index ? (
            <View
              style={{
                ...styles.emptyWrapper,
                height: itemsHeight[state.dragIndex],
              }}
            />
          ) : (
            renderItem({item, index})
          )}
        </View>
      </TapGestureHandler>
    );
  };

  const renderSeparator = (): ReactElement => (
    <View onLayout={onLayoutSeparator}>
      {ItemSeparatorComponent && <ItemSeparatorComponent />}
    </View>
  );

  const getItemLayout = (data: any, index: number) => ({
    length: itemsHeight[index],
    offset: itemsHeight[index] * index,
    index,
  });

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
            windowSize={11}
            getItemLayout={getItemLayout}
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
