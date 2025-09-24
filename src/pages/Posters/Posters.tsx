import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import { posters } from '../../data/posters';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { resolveAssetPath } from '../../utils/media';
import styles from './Posters.module.css';

const Posters = () => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    const checkoutSession = searchParams.get('session_id');

    if ((checkoutStatus === 'success' || checkoutStatus === 'cancelled') && checkoutSession) {
      navigate(`/posters/checkout/result?status=${checkoutStatus}&session_id=${checkoutSession}`, { replace: true });
    } else if (checkoutStatus) {
      navigate('/posters', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <SectionHeader
            overline="Posters"
            title="Studio editions for your walls"
            description="Limited drops and open edition posters pulled from in-progress graphite studies and performance documentation."
            align="center"
          />
        </div>
      </section>

      <section>
        <div className="container">
          <div className={styles.grid}>
            {posters.map((poster) => (
                <div key={poster.id} className={styles.card}>
                  <Link to={`/posters/${poster.id}`} className={styles.cardLink}>
                    <div className={styles.media}>
                      <img src={resolveAssetPath(poster.image)} alt={poster.title} loading="lazy" />
                    </div>

                    <div className={styles.content}>
                      <h2>{poster.title}</h2>
                      <p className={styles.dimensions}>{poster.dimensions}</p>
                      <p className={styles.description}>{poster.description}</p>
                      <div className={styles.meta}>
                        <span className={styles.price}>{formatCurrency(poster.priceCents / 100, poster.currency)}</span>
                        <span className={styles.inventory}>
                          {poster.inventoryStatus === 'limited' ? 'Limited edition drop' : 'Open edition'}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => addToCart(poster.id)}
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Posters;
