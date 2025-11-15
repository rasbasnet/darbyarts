import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import { getPosterById } from '../../data/posters';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { resolveAssetPath } from '../../utils/media';
import { POSTERS_SALES_ENABLED } from '../../config/features';
import { useInventory } from '../../context/InventoryContext';
import { formatStockLabel, isSoldOut } from '../../utils/stock';
import styles from './PosterDetail.module.css';

const PosterDetail = () => {
  const { posterId } = useParams<{ posterId: string }>();
  const poster = posterId ? getPosterById(posterId) : null;
  const { addToCart } = useCart();
  const isSalesEnabled = POSTERS_SALES_ENABLED;
  const { getAvailability, isLoading: isInventoryLoading } = useInventory();

  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(poster?.editions?.[0]?.id ?? null);

  useEffect(() => {
    setSelectedEditionId(poster?.editions?.[0]?.id ?? null);
  }, [poster]);

  const selectedEdition = useMemo(
    () => poster?.editions?.find((edition) => edition.id === selectedEditionId) ?? null,
    [poster?.editions, selectedEditionId]
  );

  const selectedEditionAvailability = useMemo(() => {
    if (!poster) {
      return null;
    }

    if (selectedEdition) {
      return getAvailability(poster.id, selectedEdition.id);
    }

    if (!poster.editions?.length) {
      return getAvailability(poster.id, null);
    }

    return null;
  }, [getAvailability, poster, selectedEdition]);

  const selectedEditionStockLabel = formatStockLabel(
    selectedEditionAvailability?.available,
    selectedEditionAvailability?.initial
  );

  const isSelectedEditionSoldOut = isSoldOut(selectedEditionAvailability?.available);
  const isStockInfoAvailable = Boolean(selectedEditionAvailability);

  if (!poster) {
    return <Navigate to="/posters" replace />;
  }

  const requiresEdition = Boolean(poster.editions?.length);

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
              {poster.isAvailable === false ? ' · Coming soon' : ''}
            </figcaption>
          </figure>

          <div className={styles.detailColumn}>
            <div className={styles.panel}>
              {(() => {
                const editions = poster.editions ?? [];
                if (editions.length > 0) {
                  const prices = editions.map((edition) => edition.priceCents);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const minLabel = formatCurrency(minPrice / 100, poster.currency);
                  const priceLabel =
                    minPrice === maxPrice ? minLabel : `${minLabel} – ${formatCurrency(maxPrice / 100, poster.currency)}`;
                  return <p className={styles.price}>{priceLabel}</p>;
                }
                return <p className={styles.price}>{formatCurrency(poster.priceCents / 100, poster.currency)}</p>;
              })()}
              <p className={styles.note}>
                All posters ship rolled in archival tubes within 10 business days. Flat $15 shipping is applied at checkout for U.S. and Canada orders.
              </p>
              {poster.maxQuantityPerEdition ? (
                <p className={styles.note}>
                  {poster.maxQuantityPerEdition === 1
                    ? 'Limited to one per edition per order.'
                    : `Limited to ${poster.maxQuantityPerEdition} per edition per order.`}
                </p>
              ) : poster.maxQuantityPerOrder ? (
                <p className={styles.note}>
                  {poster.maxQuantityPerOrder === 1
                    ? 'Limited to one per order.'
                    : `Limited to ${poster.maxQuantityPerOrder} per order.`}
                </p>
              ) : null}

              {poster.editions?.length ? (
                <fieldset className={styles.editionGroup}>
                  <legend>Choose an edition</legend>
                  <div className={styles.editionOptions}>
                    {poster.editions.map((edition) => {
                      const isSelected = selectedEditionId === edition.id;
                      const availability = getAvailability(poster.id, edition.id);
                      const stockLabel = formatStockLabel(availability?.available, availability?.initial);
                      const soldOut = isSoldOut(availability?.available);
                      const optionClassNames = [
                        styles.editionOption,
                        isSelected ? styles.editionOptionSelected : '',
                        soldOut ? styles.editionOptionDisabled : ''
                      ]
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <label
                          key={edition.id}
                          className={optionClassNames}
                        >
                          <input
                            type="radio"
                            name="edition"
                            value={edition.id}
                            checked={isSelected}
                            onChange={() => setSelectedEditionId(edition.id)}
                            disabled={soldOut}
                          />
                          <span>
                            <strong>{edition.label}</strong>
                            <em>{formatCurrency(edition.priceCents / 100, poster.currency)}</em>
                            {edition.description ? <small>{edition.description}</small> : null}
                            {stockLabel ? (
                              <small
                                className={`${styles.editionStock} ${
                                  soldOut ? styles.editionStockSoldOut : ''
                                }`.trim()}
                              >
                                {stockLabel}
                              </small>
                            ) : isInventoryLoading ? (
                              <small className={styles.editionStock}>Checking stock…</small>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              {selectedEdition ? (
                <div className={styles.editionSummary}>
                  <h4>{selectedEdition.label}</h4>
                  {selectedEdition.description ? <p>{selectedEdition.description}</p> : null}
                  {selectedEdition.details?.length ? (
                    <ul>
                      {selectedEdition.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {selectedEditionStockLabel ? (
                <p
                  className={`${styles.stockBadge} ${
                    isSelectedEditionSoldOut ? styles.stockBadgeSoldOut : ''
                  }`.trim()}
                >
                  {selectedEditionStockLabel}
                </p>
              ) : isInventoryLoading ? (
                <p className={styles.stockBadge}>Checking stock…</p>
              ) : null}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => addToCart(poster.id, selectedEdition?.id ?? null)}
                  disabled=
                    {!isSalesEnabled ||
                    (requiresEdition && !selectedEdition) ||
                    isSelectedEditionSoldOut ||
                    (!isInventoryLoading && !isStockInfoAvailable)}
                >
                  {isSalesEnabled
                    ? !isInventoryLoading && !isStockInfoAvailable
                      ? 'Inventory unavailable'
                      : 'Add to cart'
                    : 'Coming soon'}
                </button>
              </div>

              {isSelectedEditionSoldOut ? (
                <p className={styles.soldOutNotice}>
                  This edition has sold out. Please choose another edition to continue.
                </p>
              ) : null}
            </div>

            <div className={styles.infoPanel}>
              <h3>About this poster</h3>
              <p>{poster.description}</p>
              {!isSalesEnabled ? (
                <p className={styles.notice}>Edition sales open soon</p>
              ) : null}
              {selectedEdition?.description && !poster.editions?.length ? (
                <p className={styles.note}>{selectedEdition.description}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PosterDetail;
