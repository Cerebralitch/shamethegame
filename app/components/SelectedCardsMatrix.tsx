import React from "react";
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const CATEGORIES = {
  WORTH: "worth",
  SHAME: "shame",
  ACTIVATION: "activation",
};

const SelectedCardsMatrix = ({ selectedCards, handleDeselectCard }) => {
  return (
    <View style={styles.staticContainer}>
      <View style={styles.cardSlot}>
        {selectedCards.worth ? (
          <TouchableOpacity onPress={() => handleDeselectCard(CATEGORIES.WORTH)}>
            <Image source={selectedCards.worth.front} style={styles.cardImage} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.placeholder}>WORTH</Text>
        )}
      </View>

      {selectedCards.shame.map((card, index) => (
        <View key={index} style={styles.cardSlot}>
          {card ? (
            <TouchableOpacity onPress={() => handleDeselectCard(CATEGORIES.SHAME, index)}>
              <Image source={card.front} style={styles.cardImage} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.placeholder}>SHAME</Text>
          )}
        </View>
      ))}

      <View style={styles.cardSlot}>
        {selectedCards.activation ? (
          <TouchableOpacity onPress={() => handleDeselectCard(CATEGORIES.ACTIVATION)}>
            <Image source={selectedCards.activation.front} style={styles.cardImage} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.placeholder}>ACTIVATION</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  staticContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: "90%",
    alignSelf: "center",
  },
  cardSlot: {
    width: width * 0.22,
    height: 320, // Adjusted height to match lower cards
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
  },
  cardImage: {
    width: width * 0.2,
    height: 320, // Now identical to the lower deck cards
    resizeMode: "contain",
    marginHorizontal: 5,
  },
  placeholder: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
});

export default SelectedCardsMatrix;

