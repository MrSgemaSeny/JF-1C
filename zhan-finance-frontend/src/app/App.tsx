import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/home'
import { AboutPage } from '@/pages/about'
import { ServicesPage } from '@/pages/services'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-beige text-slate-900 font-sans">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
