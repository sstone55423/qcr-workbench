import React from 'react'
import ReactDOM from 'react-dom/client'
// Self-hosted fonts (bundled into dist/), so the app makes no third-party font
// request. The variable packages register the 'Inter Variable' /
// 'Source Serif 4 Variable' families referenced in index.css.
import '@fontsource-variable/inter'
import '@fontsource-variable/source-serif-4'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
