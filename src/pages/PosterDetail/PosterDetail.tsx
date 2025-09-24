import { Navigate, useParams } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import { getPosterById } from '../../data/posters';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { resolveAssetPath } from '../../utils/media';
import styles from './PosterDetail.module.css';

const PosterDetail = () => {
  const { posterId } = useParams<{ posterId: string }>();
  const poster = posterId ? getPosterById(posterId) : null;
  const { addToCart } = useCart();

  if (!poster) {
    return <Navigate to="/posters" replace />;
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <SectionHeader
            overline="Poster Edition"
            title={poster.title}
            description={poster.description}
          />
        </div>
      </section>

      <section>
        <div className={`container ${styles.layout}`}>
          <figure className={styles.figure}>
            <img src={resolveAssetPath(poster.image)} alt={poster.title} />
            <figcaption>
              {poster.dimensions} · {poster.inventoryStatus === 'limited' ? 'Limited edition' : 'Open edition'}
            </figcaption>
          </figure>

          <div className={styles.panel}>
            <p className={styles.price}>{formatCurrency(poster.priceCents / 100, poster.currency)}</p>
            <p className={styles.note}>All posters ship rolled in archival tubes within 10 business days.</p>

            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={() => addToCart(poster.id)}>
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PosterDetail;
