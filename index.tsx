import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import MemberPortal from './components/MemberPortal';
import { AuthProvider } from './components/AuthContext';
import './index.css';

// Hash-based routing: /#/portal renders the member portal, everything else renders admin
const RootRouter = () => {
  const [isPortal, setIsPortal] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      setIsPortal(window.location.hash.startsWith('#/portal'));
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  if (isPortal) {
    // Portal does NOT need AuthProvider (uses its own phone+password auth)
    return <MemberPortal />;
  }

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>
);
