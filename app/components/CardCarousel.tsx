import React, { useState } from "react";
import {
  FlatList,
  Image,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

const CardCarousel = ({ cards, handleSelectCard }) => {
  const [flippedCards, setFlippedCards] = useState({});

  const handleFlip = (cardId) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  return (
    <FlatList
      data={cards}
      keyExtractor={(item) => item.id.toString()}
      horizontal
      pagingEnabled={false}
      showsHorizontalScrollIndicator={true}
      contentContainerStyle={styles.carousel}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => handleSelectCard(item)}
          onLongPress={() => handleFlip(item.id)}
          activeOpacity={0.8}
        >
          <Image
            source={flippedCards[item.id] ? item.back : item.front}
            style={styles.cardImage}
          />
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  carousel: {
    alignItems: "center",
    paddingHorizontal: 5,
  },
  cardImage: {
    width: width * 0.2,
    height: 320,
    resizeMode: "contain",
    marginHorizontal: 5,
  },
});

export default CardCarousel;
