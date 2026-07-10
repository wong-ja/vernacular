import type { AppProps } from 'next/app';
import '../styles/globals.css';
import TopNav from '../components/TopNav';
import { ToastProvider } from '../components/ui/Toast';
import { ThemeProvider } from '../components/ThemeContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TopNav />
        <main className="pt-14 min-h-screen bg-base">
          <Component {...pageProps} />
        </main>
      </ToastProvider>
    </ThemeProvider>
  );
}
