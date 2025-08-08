import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/minimalist.css'
import './i18n/hardcoded'
import 'leaflet/dist/leaflet.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
