import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Artwork } from '../../data/artworks';
import styles from './HeroCollage.module.css';

const TILE_SLOTS = ['slotOne', 'slotTwo', 'slotThree', 'slotFour', 'slotFive'] as const;

const shuffle = <T,>(input: T[]): T[] => {
  const output = [...input];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [output[index], output[randomIndex]] = [output[randomIndex], output[index]];
  }
  return output;
};

type HeroCollageProps = {
  items: Artwork[];
};

const HeroCollage = ({ items }: HeroCollageProps) => {
  const collageRef = useRef<HTMLDivElement>(null);

  const tiles = useMemo(() => shuffle(items).slice(0, TILE_SLOTS.length), [items]);

  useEffect(() => {
    const node = collageRef.current;
    if (!node) {
      return undefined;
    }

    const updateRotation = () => {
      const rotation = window.scrollY * 0.04;
      node.style.setProperty('--collage-rotation', `${rotation}deg`);
    };

    updateRotation();

    const onScroll = () => {
      if (node) {
        updateRotation();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className={styles.shell} ref={collageRef}>
      {tiles.map((artwork, index) => (
        <Link key={artwork.id} to={`/artwork/${artwork.id}`} className={`${styles.tile} ${styles[TILE_SLOTS[index]]}`}>
          <div className={styles.imageWrap}>
            <img src={artwork.image} alt={artwork.alt} loading="lazy" />
          </div>
          <div className={styles.caption}>
            <span>{artwork.title}</span>
            <span>{artwork.year}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default HeroCollage;
