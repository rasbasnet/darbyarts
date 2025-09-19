import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import About from './pages/About/About';
import Artwork from './pages/Artwork/Artwork';
import ArtworkDetail from './pages/ArtworkDetail/ArtworkDetail';
import Contact from './pages/Contact/Contact';
import Exhibitions from './pages/Exhibitions/Exhibitions';
import Home from './pages/Home/Home';

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="artwork" element={<Artwork />} />
      <Route path="artwork/:artworkId" element={<ArtworkDetail />} />
      <Route path="about" element={<About />} />
      <Route path="exhibitions" element={<Exhibitions />} />
      <Route path="contact" element={<Contact />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
