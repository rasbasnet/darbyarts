import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { posters } from '../../data/posters';
import { formatCurrency } from '../../utils/formatCurrency';
import { resolveAssetPath } from '../../utils/media';
import styles from './Posters.module.css';

const Posters = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const featuredPoster = posters[0];

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
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.heroOverline}>Studio poster program</span>
              <h1>Concert prints that shimmer like stage lights</h1>
              <p>
                Darby’s official Johnny Blue Skies gig posters fuse graphite realism with iridescent foil. Each drop is
                screen printed in small batches, signed in-studio, and ships ready to frame.
              </p>

              <ul className={styles.heroHighlights}>
                <li>Signed & numbered variants</li>
                <li>Archival inks on heavyweight stock</li>
                <li>Secure Stripe checkout & tracked shipping</li>
              </ul>
            </div>

            {featuredPoster ? (
              <figure className={styles.heroPoster}>
                <img src={resolveAssetPath(featuredPoster.image)} alt={featuredPoster.title} />
                <figcaption>
                  <strong>{featuredPoster.title}</strong>
                  <span>{featuredPoster.dimensions}</span>
                  <span>Foil & matte variants available</span>
                </figcaption>
              </figure>
            ) : null}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className={styles.grid}>
            {posters.map((poster) => {
              const hasEditions = Array.isArray(poster.editions) && poster.editions.length > 0;
              const priceRange = hasEditions
                ? (() => {
                    const prices = poster.editions!.map((edition) => edition.priceCents);
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    const minLabel = formatCurrency(minPrice / 100, poster.currency);
                    if (minPrice === maxPrice) {
                      return minLabel;
                    }
                    const maxLabel = formatCurrency(maxPrice / 100, poster.currency);
                    return `${minLabel} – ${maxLabel}`;
                  })()
                : formatCurrency(poster.priceCents / 100, poster.currency);

              return (
                <div key={poster.id} className={styles.card}>
                  <Link to={`/posters/${poster.id}`} className={styles.cardLink}>
                    <div className={styles.media}>
                      <img src={resolveAssetPath(poster.image)} alt={poster.title} loading="lazy" />
                    </div>

                    <div className={styles.content}>
                      <h2>{poster.title}</h2>
                      <p className={styles.dimensions}>{poster.dimensions}</p>
                      <p className={styles.description}>{poster.description}</p>
                      {poster.releaseInfo ? <p className={styles.releaseInfo}>{poster.releaseInfo}</p> : null}
                      <div className={styles.meta}>
                        <span className={styles.price}>{priceRange}</span>
                        <span className={styles.inventory}>
                          {poster.inventoryStatus === 'limited' ? 'Limited edition drop' : 'Open edition'}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className={styles.actions}>
                    <Link
                      to={`/posters/${poster.id}`}
                      className={styles.primaryButton}
                      aria-label={`Buy ${poster.title}`}
                    >
                      {poster.isAvailable === false ? 'View details' : 'Buy'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Posters;
