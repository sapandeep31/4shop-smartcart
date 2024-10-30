import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [items, setItems] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showFinalBill, setShowFinalBill] = useState(false);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [showBill, setShowBill] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setShowScanner(false);

    const parts = data.split(',');
    if (parts.length !== 2 || isNaN(parts[1])) {
      Alert.alert("Invalid Barcode", "The scanned barcode is not in the correct format.");
      return;
    }

    const [name, price] = parts;
    const product = {
      barcode: data,
      name: name.trim(),
      price: parseFloat(price),
      quantity: 1,
    };

    setItems((prevItems) => {
      const existingItem = prevItems.find(item => item.barcode === product.barcode);
      if (existingItem) {
        return prevItems.map(item =>
          item.barcode === product.barcode
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, product];
      }
    });

    setShowBill(true);

    if (name.toLowerCase().includes('cashew-200 gm')) {
      setRecommendedItems([
        { name: 'Almonds', price: 599 },
        { name: 'Pistachios', price: 799 },
        { name: 'Walnuts', price: 899 }
      ]);
    } else if (name.toLowerCase().includes('dairy milk silk')) {
      setRecommendedItems([
        { name: 'Chocolate Cookies', price: 150 },
        { name: 'Chocolate Syrup', price: 200 },
        { name: 'Chocolate Chips', price: 120 }
      ]);
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayNow = () => {
    setShowFinalBill(true);
  };

  const handleAddRecommendation = (item) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(i => i.name === item.name);
      if (existingItem) {
        return prevItems.map(i =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  const handleRemoveItem = (barcode) => {
    setItems((prevItems) =>
      prevItems
        .map(item => item.barcode === barcode ? { ...item, quantity: item.quantity - 1 } : item)
        .filter(item => item.quantity > 0)
    );
  };

  const handleShare = (item) => {
    Alert.alert("Share", `Sharing ${item.name}`);
  };

  const handleIconPress = (name) => {
    Alert.alert(name, `You pressed the ${name} icon.`);
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  if (showFinalBill) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Final Bill</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.barcode}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item.name} x{item.quantity}</Text>
              <Text>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          )}
          ListFooterComponent={<Text style={styles.total}>Total: ₹{total.toFixed(2)}</Text>}
        />
        <TouchableOpacity style={styles.backButton} onPress={() => setShowFinalBill(false)}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
  <View style={styles.container}>
    {showScanner && (
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
    )}

    {!showScanner && !showBill && (
      <Text style={styles.welcome}>Welcome to 4Shop</Text>
    )}

    {!showScanner && showBill && (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Bill</Text>

        <FlatList
          data={items}
          keyExtractor={(item) => item.barcode}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item.name}</Text>
              <Text>₹{(item.price * item.quantity).toFixed(2)}</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => handleRemoveItem(item.barcode)}>
                  <MaterialIcons name="remove-circle-outline" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => handleAddRecommendation(item)}>
                  <MaterialIcons name="add-circle-outline" size={24} color="black" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => handleShare(item)}>
                <FontAwesome5 name="share" size={20} color="black" />
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <>
              <Text style={styles.total}>Total: ₹{total.toFixed(2)}</Text>

              {recommendedItems.length > 0 && (
                <View style={styles.recommendations}>
                  <Text style={styles.recommendationTitle}>Recommended Additions:</Text>
                  {recommendedItems.map((recItem, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Text>{recItem.name}</Text>
                      <Text>₹{recItem.price.toFixed(2)}</Text>
                      <TouchableOpacity onPress={() => handleAddRecommendation(recItem)}>
                        <MaterialIcons name="add-circle-outline" size={24} color="black" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.payNowContainer}>
                <TouchableOpacity style={styles.payNowButton} onPress={handlePayNow}>
                  <Text style={styles.payNowButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            </>
          }
        />
      </ScrollView>
    )}

    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => handleIconPress('Discounts')}>
        <MaterialIcons name="local-offer" size={24} color="black" />
        <Text style={styles.iconLabel}>Discounts</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleIconPress('Search')}>
        <FontAwesome5 name="search" size={24} color="black" />
        <Text style={styles.iconLabel}>Search</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => { setScanned(false); setShowScanner(true); }}
        style={styles.scanButton}
      >
        <MaterialIcons name="center-focus-strong" size={36} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleIconPress('Profile')}>
        <FontAwesome5 name="user" size={24} color="black" />
        <Text style={styles.iconLabel}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleIconPress('Settings')}>
        <MaterialIcons name="settings" size={24} color="black" />
        <Text style={styles.iconLabel}>Settings</Text>
      </TouchableOpacity>
    </View>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f2ff', // Light blue background
    paddingTop: 40,
    paddingBottom: 80, // to make room for navbar
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 8,
    backgroundColor: '#ffffff', // White background for each item
    borderRadius: 8, // Rounded corners
    shadowColor: '#000', // Shadow color
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.1, // Shadow opacity
    shadowRadius: 4, // Shadow radius
    elevation: 2, // Elevation for Android
},
quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
},
quantityText: {
    marginHorizontal: 8,
    fontSize: 16,
},
total: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 10,
    marginRight: 20,
    color: '#0044cc', // Bluish color for total amount
},
recommendations: {
    marginTop: 20,
    paddingHorizontal: 10,
},
recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0044cc', // Bluish color for recommendation title
},
recommendationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
},
payNowContainer: {
    alignItems: 'center',
    marginTop: 20,
},
payNowButton: {
    backgroundColor: '#0044cc', // Blue color for Pay Now button
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
},
payNowButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
},
backButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
},
backButtonText: {
    color: '#ffffff',
    fontSize: 16,
},
navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
},
scanButton: {
    backgroundColor: '#0044cc', // Blue color for scan button
    borderRadius: 50,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
},
iconLabel: {
    fontSize: 12,
    textAlign: 'center',
},
welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#0044cc', // Bluish color for welcome message
},
title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#0044cc', // Bluish color for titles
},

})