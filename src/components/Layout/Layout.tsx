import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../Footer/Footer';
import Navigation from '../Navigation/Navigation';
import styles from './Layout.module.css';

const Layout = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const updateScrollTint = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const accentHue = 320 + ratio * 20;
      const accent = `hsla(${accentHue.toFixed(1)}, 78%, 68%, 0.6)`;
      const shadow = `hsla(${(accentHue + 200).toFixed(1)}, 50%, 18%, ${0.4 + ratio * 0.1})`;
      document.documentElement.style.setProperty('--scroll-accent', accent);
      document.documentElement.style.setProperty('--scroll-shadow', shadow);
    };

    updateScrollTint();
    window.addEventListener('scroll', updateScrollTint, { passive: true });
    window.addEventListener('resize', updateScrollTint);

    return () => {
      window.removeEventListener('scroll', updateScrollTint);
      window.removeEventListener('resize', updateScrollTint);
    };
  }, []);

  return (
    <div className={styles.shell}>
      <Navigation />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
      <div className={styles.grain} aria-hidden />
    </div>
  );
};

export default Layout;
