import {StyleSheet, ViewStyle} from 'react-native';

export interface Style {
  container: ViewStyle;
  dragWrapper: ViewStyle;
  emptyWrapper: ViewStyle;
}

const styles = StyleSheet.create<Style>({
  container: {
    flex: 1,
  },
  dragWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#4B3480',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrapper: {
    width: '100%',
    backgroundColor: 'white',
  },
});

export default styles;
