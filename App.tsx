import React, {ReactElement} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Alert,
} from 'react-native';
import DraggableList from './src/components/draggableList/DraggableList';
import IDragListItem, {exampleData} from './src/utils/constans';

const App = (): ReactElement => {
  const onItemPress = (): void => {
    Alert.alert('You click on item');
  };

  const renderItem = ({item}: {item: IDragListItem}): ReactElement => {
    return (
      <View
        style={{
          ...styles.listItemWrapper,
          backgroundColor: item.backgroundColor,
        }}>
        <Text style={styles.listItemText}>{item.value}</Text>
      </View>
    );
  };

  const renderSeparator = (): ReactElement => <View style={styles.separator} />;
  const keyExtractor = (item: IDragListItem): string => item.id;

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.flex}>
        <DraggableList
          data={exampleData}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          keyExtractor={keyExtractor}
          onItemPress={onItemPress}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  separator: {
    width: '100%',
    height: 2,
    backgroundColor: 'white',
  },
  listItemWrapper: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemText: {
    color: 'black',
    fontSize: 22,
  },
});

export default App;
