import {
  COMPONENT_INITIALIZATION,
  isIos,
  ON_DRAG_ACTIVE,
  ON_DRAG_END,
  ON_DRAG_START,
  UPDATE_SEQUENCE,
} from '../../utils/constans';

interface IAction {
  type: string;
  payload?: any;
}

export interface IState {
  dragging: boolean;
  dragIndex: number;
  dataList: any[];
  init: boolean;
}

export const initialState: IState = {
  dragging: false,
  dragIndex: -1,
  dataList: [],
  init: false,
};

export const reducer = (state: IState, {type, payload}: IAction): IState => {
  switch (type) {
    case COMPONENT_INITIALIZATION:
      return {...state, init: true, dataList: payload};
    case ON_DRAG_START:
      return {...state, dragging: isIos, dragIndex: payload};
    case ON_DRAG_ACTIVE:
      return {...state, dragging: true};
    case ON_DRAG_END:
      return {...state, dragging: false, dragIndex: -1};
    case UPDATE_SEQUENCE:
      const {newData, newIndex} = payload;
      return {...state, dataList: newData, dragIndex: newIndex};
    default:
      return state;
  }
};
