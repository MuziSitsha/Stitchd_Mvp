import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeContext'
import { Entry } from './pages/Entry'
import { SupplierAuth } from './pages/SupplierAuth'
import { SupplierClaim } from './pages/SupplierClaim'
import { SupplierPortal } from './pages/SupplierPortal'
import { RequestSupplier } from './pages/RequestSupplier'
import { AdminAuth } from './pages/AdminAuth'
import { AdminConsole } from './pages/AdminConsole'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Entry />} />
          <Route path="/request" element={<RequestSupplier />} />
          <Route path="/supplier/login" element={<SupplierAuth />} />
          <Route path="/supplier/claim" element={<SupplierClaim />} />
          <Route path="/supplier" element={<SupplierPortal />} />
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/admin" element={<AdminConsole />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
