import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { profile } from '../../data/profile';
import { useCart } from '../../context/CartContext';
import styles from './Navigation.module.css';

const links = [
  { to: '/', label: 'Home' },
  { to: '/artwork', label: 'Artwork' },
  { to: '/about', label: 'About' },
  { to: '/exhibitions', label: 'Exhibitions' },
  { to: '/posters', label: 'Posters' }
];

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { items, openDrawer } = useCart();
  const totalQuantity = items.reduce((total, poster) => total + poster.quantity, 0);

  const toggleMenu = () => setIsMenuOpen((open) => !open);
  const closeMenu = () => setIsMenuOpen(false);

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.brand} onClick={closeMenu}>
          <span className={styles.brandWordmark}>{profile.name}</span>
          <span className={styles.brandSubtitle}>{profile.tagline}</span>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={isMenuOpen}
          aria-label="Toggle menu"
          onClick={toggleMenu}
        >
          <span className={styles.menuBar} />
          <span className={styles.menuBar} />
          <span className={styles.menuBar} />
        </button>

        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={getLinkClass} onClick={closeMenu}>
              {link.label}
            </NavLink>
          ))}
          <button type="button" className={styles.cartButton} onClick={() => { openDrawer(); closeMenu(); }}>
            Cart{totalQuantity ? ` (${totalQuantity})` : ''}
          </button>
          <Link to="/contact" className={styles.cta} onClick={closeMenu}>
            Connect
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
