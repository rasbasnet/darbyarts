import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

describe('App navigation', () => {
  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Darby Mitchell/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Artwork/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Exhibitions/i })).toBeInTheDocument();
  });
});
