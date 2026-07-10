import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import './i18n/i18n'
import { getLangFromUrl } from './utils/langQuery'

document.documentElement.lang = getLangFromUrl('en')

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
