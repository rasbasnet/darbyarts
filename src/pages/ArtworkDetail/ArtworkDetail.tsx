import { CSSProperties, useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getArtworkById } from '../../data/artworks';
import styles from './ArtworkDetail.module.css';

const ArtworkDetail = () => {
  const { artworkId } = useParams<{ artworkId: string }>();
  const artwork = artworkId ? getArtworkById(artworkId) : undefined;

  useEffect(() => {
    if (artwork) {
      document.title = `${artwork.title} — Darby Mitchell`;
      return () => {
        document.title = 'Darby Mitchell';
      };
    }
    return undefined;
  }, [artwork]);

  if (!artwork) {
    return <Navigate to="/artwork" replace />;
  }

  const themeStyles: CSSProperties = {
    '--accent-color': artwork.palette.primary,
    '--shadow-color': artwork.palette.secondary,
    '--artwork-url': `url(${artwork.image})`,
  } as CSSProperties;

  const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(artwork.created));

  return (
    <div className={styles.page} style={themeStyles}>
      <div className="container">
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/artwork">Artwork</Link>
          <span aria-hidden="true">/</span>
          <span>{artwork.title}</span>
        </nav>

        <article className={styles.card}>
          <figure className={styles.figure}>
            <img src={artwork.image} alt={artwork.alt} />
            {artwork.statement ? <figcaption>{artwork.statement}</figcaption> : null}
          </figure>

          <section className={styles.meta} aria-label="Artwork details">
            <h1>{artwork.title}</h1>
            <p className={styles.year}>{artwork.year}</p>
            <dl>
              <div>
                <dt>Created</dt>
                <dd>{formattedDate}</dd>
              </div>
              <div>
                <dt>Medium</dt>
                <dd>{artwork.medium}</dd>
              </div>
              <div>
                <dt>Dimensions</dt>
                <dd>{artwork.size}</dd>
              </div>
              {artwork.series ? (
                <div>
                  <dt>Series</dt>
                  <dd>{artwork.series}</dd>
                </div>
              ) : null}
            </dl>
            <Link to="/contact" className={styles.inquireLink}>
              Inquire about this work
            </Link>
          </section>
        </article>
      </div>
    </div>
  );
};

export default ArtworkDetail;
