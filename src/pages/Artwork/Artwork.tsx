import { CSSProperties, useEffect, useRef } from 'react';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import GalleryGrid from '../../components/GalleryGrid/GalleryGrid';
import { artworks } from '../../data/artworks';
import { collectionMetadata } from '../../data/collections';
import { embodiedArchive } from '../../data/archivalWorks';
import styles from './Artwork.module.css';

type RGBA = [number, number, number, number];

type CollectionTheme = {
  backgroundStart: RGBA;
  backgroundEnd: RGBA;
  haloColor: RGBA;
  haloPosition: [number, number];
  haloStop: number;
  sectionBorder: RGBA;
  sectionSurface: RGBA;
};

const theme = (start: RGBA, end: RGBA, haloColor: RGBA, haloPosition: [number, number], haloStop: number, border: RGBA, surface: RGBA): CollectionTheme => ({
  backgroundStart: start,
  backgroundEnd: end,
  haloColor,
  haloPosition,
  haloStop,
  sectionBorder: border,
  sectionSurface: surface
});

const collectionThemes: Record<string, CollectionTheme> = {
  'sugar-coated-apparitions': theme(
    [255, 244, 249, 0.88],
    [244, 196, 214, 0.65],
    [255, 209, 227, 0.55],
    [22, 18],
    62,
    [255, 215, 230, 0.6],
    [255, 255, 255, 0.35]
  ),
  embodied: theme(
    [214, 224, 235, 0.82],
    [168, 184, 202, 0.78],
    [193, 206, 222, 0.6],
    [78, 24],
    64,
    [174, 192, 213, 0.6],
    [236, 242, 249, 0.32]
  )
};

const toCssRgba = ([r, g, b, a]: RGBA) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(3)})`;

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const lerpColor = (start: RGBA, end: RGBA, t: number): RGBA => [
  lerp(start[0], end[0], t),
  lerp(start[1], end[1], t),
  lerp(start[2], end[2], t),
  lerp(start[3], end[3], t)
];

const mixThemes = (first: CollectionTheme, second: CollectionTheme, t: number): CollectionTheme => ({
  backgroundStart: lerpColor(first.backgroundStart, second.backgroundStart, t),
  backgroundEnd: lerpColor(first.backgroundEnd, second.backgroundEnd, t),
  haloColor: lerpColor(first.haloColor, second.haloColor, t),
  haloPosition: [
    lerp(first.haloPosition[0], second.haloPosition[0], t),
    lerp(first.haloPosition[1], second.haloPosition[1], t)
  ],
  haloStop: lerp(first.haloStop, second.haloStop, t),
  sectionBorder: lerpColor(first.sectionBorder, second.sectionBorder, t),
  sectionSurface: lerpColor(first.sectionSurface, second.sectionSurface, t)
});

const Artwork = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) {
      return;
    }

    const sections = Array.from(page.querySelectorAll('[data-collection]')) as HTMLElement[];
    if (!sections.length) {
      return;
    }

    const metrics = () =>
      sections.map((section) => ({
        element: section,
        top: section.offsetTop,
        id: section.dataset.collection ?? ''
      }));

    let sectionMetrics = metrics();

    const applyTheme = (themeToApply: CollectionTheme) => {
      page.style.setProperty('--artwork-bg-start', toCssRgba(themeToApply.backgroundStart));
      page.style.setProperty('--artwork-bg-end', toCssRgba(themeToApply.backgroundEnd));
      page.style.setProperty(
        '--artwork-halo-gradient',
        `radial-gradient(circle at ${themeToApply.haloPosition[0]}% ${themeToApply.haloPosition[1]}%, ${toCssRgba(
          themeToApply.haloColor,
        )}, transparent ${themeToApply.haloStop}%)`
      );
    };

    const updateTheme = () => {
      const position = window.scrollY + window.innerHeight * 0.25;
      if (!sectionMetrics.length) {
        return;
      }

      let currentIndex = sectionMetrics.findIndex((metric, index) => {
        const next = sectionMetrics[index + 1];
        if (!next) {
          return position >= metric.top;
        }
        return position >= metric.top && position < next.top;
      });

      if (currentIndex === -1) {
        currentIndex = 0;
      }

      const currentMetric = sectionMetrics[currentIndex];
      const nextMetric = sectionMetrics[Math.min(currentIndex + 1, sectionMetrics.length - 1)];

      const currentTheme = collectionThemes[currentMetric.id] ?? collectionThemes['sugar-coated-apparitions'];
      const nextTheme = collectionThemes[nextMetric.id] ?? currentTheme;

      if (currentMetric === nextMetric) {
        applyTheme(currentTheme);
        return;
      }

      const distance = nextMetric.top - currentMetric.top || 1;
      const progress = Math.min(Math.max((position - currentMetric.top) / distance, 0), 1);
      const blended = mixThemes(currentTheme, nextTheme, progress);
      applyTheme(blended);
    };

    applyTheme(collectionThemes[sections[0].dataset.collection ?? 'sugar-coated-apparitions']);
    updateTheme();

    let ticking = false;

    const handleScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        updateTheme();
        ticking = false;
      });
    };
    const handleResize = () => {
      sectionMetrics = metrics();
      updateTheme();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div ref={pageRef} className={styles.page}>
      {collectionMetadata.map((collection, index) => {
        const items = artworks.filter((artwork) => artwork.collection === collection.id);
        const isArchive = collection.id === 'embodied';
        const theme = collectionThemes[collection.id] ?? collectionThemes['sugar-coated-apparitions'];

        const sectionStyle: CSSProperties = {
          '--section-border': toCssRgba(theme.sectionBorder),
          '--section-surface': toCssRgba(theme.sectionSurface)
        } as CSSProperties;

        return (
          <section
            key={collection.id}
            className={styles.collectionSection}
            data-collection={collection.id}
            style={sectionStyle}
          >
            <div className="container">
              <div className={styles.collectionIntro}>
                <SectionHeader
                  overline={index === 0 ? 'Catalogue' : 'Archive'}
                  title={`${collection.title} (${collection.years})`}
                  description={collection.statement[0]}
                  tone="dark"
                />
                {collection.statement.slice(1).map((paragraph) => (
                  <p key={paragraph} className={styles.collectionParagraph}>{paragraph}</p>
                ))}
              </div>

              <div className={styles.notesGrid}>
                <article>
                  <h3>Materials & process</h3>
                  <p>{collection.materialsProcess}</p>
                </article>
                <article>
                  <h3>Series threads</h3>
                  <p>{collection.seriesThreads}</p>
                </article>
                <article>
                  <h3>Acquisitions</h3>
                  <p>{collection.acquisitions}</p>
                  {collection.downloadUrl ? (
                    <a href={collection.downloadUrl} className={styles.downloadLink} target="_blank" rel="noreferrer">
                      {collection.downloadLabel ?? 'Download exhibition packet'}
                    </a>
                  ) : null}
                </article>
              </div>
            </div>

            <div className={`${styles.collectionBody} ${isArchive ? styles.archiveBody : ''}`}>
              <div className="container">
                {items.length > 0 ? (
                  <GalleryGrid items={items} dense />
                ) : (
                  <div className={styles.archiveList}>
                    <h4>Works included</h4>
                    <ul>
                      {embodiedArchive.map((work) => (
                        <li key={work.title}>
                          <span className={styles.archiveTitle}>{work.title}</span>
                          <span>{work.medium}</span>
                          <span>{work.size}</span>
                          <span>{work.year}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Artwork;
