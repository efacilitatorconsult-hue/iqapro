import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
// 1. ADD THIS LINE
import { SpeedInsights } from "@vercel/speed-insights/react" 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {/* 2. ADD THIS TAG */}
    <SpeedInsights /> 
  </React.StrictMode>,
)
