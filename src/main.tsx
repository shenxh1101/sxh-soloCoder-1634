import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useStore } from './store/useStore'

function AppInitializer() {
  const loadData = useStore(state => state.loadData);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppInitializer />
  </StrictMode>,
)
