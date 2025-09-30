import { Link } from 'react-router-dom';
import { profile } from '../../data/profile';
import styles from './Footer.module.css';

const Footer = () => (
  <footer className={styles.footer}>
    <div className={`container ${styles.inner}`}>
      <div>
        <p className={styles.signature}>{profile.name}</p>
        <p className={styles.smallPrint}>{profile.tagline}</p>
      </div>

      <nav className={styles.footerNav} aria-label="Footer navigation">
        <Link to="/artwork">Artwork</Link>
        <Link to="/about">About</Link>
        <Link to="/exhibitions">Exhibitions</Link>
        <Link to="/posters">Posters</Link>
        <Link to="/contact">Contact</Link>
      </nav>

      <div className={styles.meta}>
        <a href={profile.contact.instagram} target="_blank" rel="noreferrer">
          Instagram
        </a>
        <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <a href="https://raskkal.com/" target="_blank" rel="noreferrer">
          Website by Raskkal
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
