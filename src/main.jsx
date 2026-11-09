import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BatteryProvider } from './context/BatteryContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BatteryProvider>
      <App />
    </BatteryProvider>
  </StrictMode>,
)
