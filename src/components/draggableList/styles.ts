import {StyleSheet, ViewStyle} from 'react-native';

export interface Style {
  container: ViewStyle;
  dragWrapper: ViewStyle;
  emptyWrapper: ViewStyle;
}

const styles = StyleSheet.create<Style>({
  container: {},
  dragWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  emptyWrapper: {
    backgroundColor: 'white',
  },
});

export default styles;
