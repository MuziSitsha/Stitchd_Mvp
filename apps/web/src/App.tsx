import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeContext'
import { Entry } from './pages/Entry'
import { SupplierAuth } from './pages/SupplierAuth'
import { SupplierClaim } from './pages/SupplierClaim'
import { SupplierOnboarding } from './pages/SupplierOnboarding'
import { SupplierPortal } from './pages/SupplierPortal'
import { RequestSupplier } from './pages/RequestSupplier'
import { LeadThread } from './pages/LeadThread'
import { AdminAuth } from './pages/AdminAuth'
import { AdminConsole } from './pages/AdminConsole'
import { RsvpInvite, RsvpGuestForm, RsvpConfirmed } from './pages/RsvpGuest'
import { RsvpHostManager } from './pages/RsvpHostManager'
import { ReadinessHostManager } from './pages/ReadinessHostManager'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Entry />} />
          <Route path="/request" element={<RequestSupplier />} />
          <Route path="/thread/:ref" element={<LeadThread />} />
          <Route path="/supplier/login" element={<SupplierAuth />} />
          <Route path="/supplier/claim" element={<SupplierClaim />} />
          <Route path="/supplier/onboarding" element={<SupplierOnboarding />} />
          <Route path="/supplier" element={<SupplierPortal />} />
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/admin" element={<AdminConsole />} />
          <Route path="/invite/:token" element={<RsvpInvite />} />
          <Route path="/rsvp" element={<RsvpGuestForm />} />
          <Route path="/rsvp/confirmed" element={<RsvpConfirmed />} />
          <Route path="/rsvp-manager" element={<RsvpHostManager />} />
          <Route path="/readiness-manager" element={<ReadinessHostManager />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
