import { CSSProperties } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getArtworkById } from '../../data/artworks';
import { getExhibitionDetail } from '../../data/exhibitionDetails';
import styles from './ExhibitionDetail.module.css';

const ExhibitionDetail = () => {
  const { exhibitionId } = useParams<{ exhibitionId: string }>();
  if (!exhibitionId) {
    return <Navigate to="/exhibitions" replace />;
  }

  const detail = getExhibitionDetail(exhibitionId);
  if (!detail) {
    return <Navigate to="/exhibitions" replace />;
  }

  const heroArtwork = detail.heroArtworkId ? getArtworkById(detail.heroArtworkId) : undefined;
  const gradientStyles: CSSProperties = heroArtwork
    ? {
        '--accent-color': heroArtwork.palette.primary,
        '--shadow-color': heroArtwork.palette.secondary
      }
    : {};

  return (
    <div className={styles.page} style={gradientStyles}>
      <div className="container">
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/exhibitions">Exhibitions</Link>
          <span aria-hidden="true">/</span>
          <span>{detail.title}</span>
        </nav>

        <header className={styles.header}>
          <div>
            <span className={styles.overline}>{detail.type}</span>
            <h1>{detail.title}</h1>
            <p className={styles.meta}>
              {detail.venue} · {detail.location} · {detail.year}
            </p>
            <p className={styles.summary}>{detail.summary}</p>
          </div>
          {heroArtwork ? (
            <figure className={styles.heroArtwork}>
              <img src={heroArtwork.image} alt={heroArtwork.alt} />
              <figcaption>
                <span>{heroArtwork.title}</span>
                <span>{heroArtwork.year}</span>
              </figcaption>
            </figure>
          ) : null}
        </header>

        <section className={styles.body}>
          {detail.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {detail.pullQuote ? (
            <blockquote className={styles.pullQuote}>{detail.pullQuote}</blockquote>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default ExhibitionDetail;
