import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import About from './pages/About/About';
import Artwork from './pages/Artwork/Artwork';
import ArtworkDetail from './pages/ArtworkDetail/ArtworkDetail';
import Contact from './pages/Contact/Contact';
import Exhibitions from './pages/Exhibitions/Exhibitions';
import ExhibitionDetail from './pages/ExhibitionDetail/ExhibitionDetail';
import Home from './pages/Home/Home';
import Posters from './pages/Posters/Posters';
import PosterDetail from './pages/PosterDetail/PosterDetail';
import CheckoutResult from './pages/Posters/CheckoutResult/CheckoutResult';
import Checkout from './pages/Posters/Checkout/Checkout';

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="artwork" element={<Artwork />} />
      <Route path="artwork/:artworkId" element={<ArtworkDetail />} />
      <Route path="about" element={<About />} />
      <Route path="exhibitions" element={<Exhibitions />} />
      <Route path="exhibitions/:exhibitionId" element={<ExhibitionDetail />} />
      <Route path="posters" element={<Posters />} />
      <Route path="posters/:posterId" element={<PosterDetail />} />
      <Route path="posters/checkout" element={<Checkout />} />
      <Route path="posters/checkout/result" element={<CheckoutResult />} />
      <Route path="contact" element={<Contact />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
