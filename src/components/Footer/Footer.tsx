import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => (
  <footer className={styles.footer}>
    <div className={`container ${styles.inner}`}>
      <div>
        <p className={styles.signature}>Darby Mitchell Studio</p>
        <p className={styles.smallPrint}>Drawing intimacies in graphite & blush.</p>
      </div>

      <nav className={styles.footerNav} aria-label="Footer navigation">
        <Link to="/artwork">Artwork</Link>
        <Link to="/about">About</Link>
        <Link to="/exhibitions">Exhibitions</Link>
        <Link to="/contact">Contact</Link>
      </nav>

      <div className={styles.meta}>
        <a
          href="https://www.instagram.com/darbymitchell.art"
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>
        <span>© {new Date().getFullYear()} Darby Mitchell</span>
      </div>
    </div>
  </footer>
);

export default Footer;
