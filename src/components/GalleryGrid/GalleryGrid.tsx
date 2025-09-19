import { Link } from 'react-router-dom';
import { Artwork } from '../../data/artworks';
import styles from './GalleryGrid.module.css';

type GalleryGridProps = {
  items: Artwork[];
  dense?: boolean;
};

const GalleryGrid = ({ items, dense = false }: GalleryGridProps) => (
  <div className={`${styles.grid} ${dense ? styles.dense : ''}`}>
    {items.map((item) => (
      <Link key={item.id} to={`/artwork/${item.id}`} className={`${styles.item} ${styles[item.orientation]}`}>
        <div className={styles.frame}>
          <img src={item.image} alt={item.alt} loading="lazy" />
        </div>
        <div className={styles.meta}>
          <h3>{item.title}</h3>
          <p>{item.medium}</p>
          <p>
            <span>{item.size}</span>
            <span aria-hidden="true">•</span>
            <span>{item.year}</span>
          </p>
          {item.series ? <p className={styles.series}>{item.series}</p> : null}
          {item.statement ? <p className={styles.statement}>{item.statement}</p> : null}
        </div>
      </Link>
    ))}
  </div>
);

export default GalleryGrid;
