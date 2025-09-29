import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { posters } from '../../data/posters';
import { formatCurrency } from '../../utils/formatCurrency';
import { resolveAssetPath } from '../../utils/media';
import { POSTERS_SALES_ENABLED } from '../../config/features';
import styles from './Posters.module.css';

const Posters = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const heroPosters = posters.slice(0, 2);
  const isSalesEnabled = POSTERS_SALES_ENABLED;

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
              <span className={styles.heroOverline}>Johnny Blue Skies</span>
              <h1>Two posters, one electric skyline</h1>
              <p>
                Both nights at Red Rocks lean on the same palette—neon copper, deep twilight blues, and foil that shifts
                like stage lights. We tuned the entire poster shop to that shared mood.
              </p>

              {!isSalesEnabled ? (
                <p className={styles.heroNotice}>Edition sales open soon</p>
              ) : null}


            </div>

            <div className={styles.heroBillboard}>
              <div className={styles.heroBillboardHeader}>
                <span>Red Rocks Amphitheatre</span>
                <span>September 16–17</span>
              </div>
              <div className={styles.heroBillboardBody}>
                {heroPosters.map((poster, index) => (
                  <figure key={poster.id} className={`${styles.heroPosterTile} ${styles[`heroPosterTile${index}`]}`}>
                    <img src={resolveAssetPath(poster.image)} alt={poster.title} />
                    <figcaption>
                      <strong>{poster.title}</strong>
                      <span>{poster.inventoryStatus === 'limited' ? 'Limited edition drop' : 'Open edition'}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
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
                    <header className={styles.cardHeader}>
                      <span className={styles.cardOverline}>Johnny Blue Skies &amp; The Dark Clouds</span>
                      <h2>{poster.title}</h2>
                      <span className={styles.cardSubhead}>Red Rocks Amphitheatre · {poster.dimensions}</span>
                    </header>

                    <div className={styles.media}>
                      <img src={resolveAssetPath(poster.image)} alt={poster.title} loading="lazy" />
                    </div>

                    <div className={styles.content}>
                      <p className={styles.description}>{poster.description}</p>
                      {poster.releaseInfo ? <p className={styles.releaseInfo}>{poster.releaseInfo}</p> : null}
                    </div>
                  </Link>

                  <div className={styles.meta}>
                    <div className={styles.metaPrice}>
                      <span className={styles.price}>{priceRange}</span>
                      <span className={styles.inventory}>
                        {poster.inventoryStatus === 'limited' ? 'Limited edition drop' : 'Open edition'}
                      </span>
                    </div>
                    {poster.editions?.length ? (
                      <ul className={styles.variantList}>
                        {poster.editions.map((edition) => (
                          <li key={edition.id}>
                            <span>{edition.label}</span>
                            <span>{formatCurrency(edition.priceCents / 100, poster.currency)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {!isSalesEnabled ? <span className={styles.comingSoonBadge}>Coming soon</span> : null}
                    <Link
                      to={`/posters/${poster.id}`}
                      className={styles.primaryButton}
                      aria-label={`View ${poster.title}`}
                    >
                      View edition details
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
