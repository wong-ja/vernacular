import type { AppProps } from 'next/app';
import '../styles/globals.css';
import TopNav from '../components/TopNav';
import { ToastProvider } from '../components/ui/Toast';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <TopNav />
      <main className="pt-14 min-h-screen bg-base">
        <Component {...pageProps} />
      </main>
    </ToastProvider>
  );
}
