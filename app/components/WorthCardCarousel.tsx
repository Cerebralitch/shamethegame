'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import Image from 'next/image';

const worthCards = [
  { id: 1, name: 'Compassionate Gardener', image: '/images/worth/compassionate-gardener.png' },
  { id: 2, name: 'Lighthouse of Triumph', image: '/images/worth/lighthouse-of-triumph.png' },
  { id: 3, name: 'Phoenix of Growth', image: '/images/worth/phoenix-of-growth.png' },
];

const WorthCardCarousel = ({ onSelect }) => {
  return (
    <Swiper slidesPerView={3} spaceBetween={10}>
      {worthCards.map((card) => (
        <SwiperSlide key={card.id} onClick={() => onSelect(card)}>
          <Image src={card.image} alt={card.name} width={150} height={220} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default WorthCardCarousel;
