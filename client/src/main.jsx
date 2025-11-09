import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// --- Auth Providers ---
import { AdminAuthProvider } from './context/AdminAuthContext.jsx' // --- NEW ---
import { AuthProvider } from './context/AuthContext.jsx'
import { CashierAuthProvider } from './context/CashierAuthContext.jsx'
import { VisitorAuthProvider } from './context/VisitorAuthContext.jsx'

/* --- Admin --- */
import App from './App.jsx' 
import AdminLoginPage from './pages/AdminLoginPage.jsx' // --- NEW ---
import EventListPage from './pages/EventListPage.jsx'
import AddEventPage from './pages/AddEventPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import AddStallPage from './pages/AddStallPage.jsx'
import AddCashierPage from './pages/AddCashierPage.jsx'
import StallFinancePage from './pages/StallFinancePage.jsx'

/* --- Stall --- */
import StallLayout from './StallLayout.jsx'
import StallLoginPage from './pages/StallLoginPage.jsx'
import StallMenuPage from './pages/stall/StallMenuPage.jsx'
import StallPosPage from './pages/stall/StallPosPage.jsx'
import StallQrPage from './pages/stall/StallQrPage.jsx'
import StallTransactionsPage from './pages/stall/StallTransactionsPage.jsx' 

/* --- Cashier --- */
import CashierLoginPage from './pages/cashier/CashierLoginPage.jsx'
import CashierDashboardPage from './pages/cashier/CashierDashboardPage.jsx'
import CashierLogPage from './pages/cashier/CashierLogPage.jsx'

/* --- Visitor --- */
import VisitorLoginPage from './pages/visitor/VisitorLoginPage.jsx'
import VisitorMenuPage from './pages/visitor/VisitorMenuPage.jsx'
// import VisitorLogPage from './pages/visitor/VisitorLogPage.jsx' // (We will add this next)


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminAuthProvider> {/* --- NEW WRAPPER --- */}
      <AuthProvider>
        <CashierAuthProvider>
          <VisitorAuthProvider>
            <BrowserRouter>
              <Routes>
                
                {/* --- ROUTE GROUP 1: ADMIN PANEL (PROTECTED) --- */}
                <Route path="/" element={<App />}>
                  <Route index element={<EventListPage />} />
                  <Route path="create-event" element={<AddEventPage />} />
                  <Route path="event/:id" element={<EventDetailPage />} />
                  <Route path="event/:id/add-stall" element={<AddStallPage />} />
                  <Route path="event/:id/add-cashier" element={<AddCashierPage />} />
                  <Route path="event/:eventId/stall/:stallId/finance" element={<StallFinancePage />} />
                </Route>
                
                {/* --- ADMIN LOGIN (PUBLIC) --- */}
                <Route path="/admin-login" element={<AdminLoginPage />} />

                {/* --- ROUTE GROUP 2: STALL (PUBLIC LOGIN) --- */}
                <Route path="/:clubSlug/stall-login" element={<StallLoginPage />} />

                {/* --- ROUTE GROUP 3: STALL DASHBOARD (PROTECTED) --- */}
                <Route path="/stall" element={<StallLayout />}>
                  <Route path="pos" element={<StallPosPage />} />
                  <Route path="menu" element={<StallMenuPage />} />
                  <Route path="transactions" element={<StallTransactionsPage />} />
                  <Route path="qr" element={<StallQrPage />} />
                  <Route path="dashboard" element={<StallPosPage />} /> 
                </Route>
                
                {/* --- ROUTE GROUP 4: CASHIER (PUBLIC LOGIN & PROTECTED APP) --- */}
                <Route path="/:clubSlug/cashier-login" element={<CashierLoginPage />} />
                <Route path="/cashier/dashboard" element={<CashierDashboardPage />} />
                <Route path="/cashier/log" element={<CashierLogPage />} />
                
                {/* --- ROUTE GROUP 5: VISITOR (PUBLIC LOGIN) --- */}
                <Route path="/:clubSlug/v/login" element={<VisitorLoginPage />} />
                <Route path="/v/stall/:stall_id" element={<VisitorMenuPage />} />
                {/* <Route path="/v/log" element={<VisitorLogPage />} /> */}

              </Routes>
            </BrowserRouter>
          </VisitorAuthProvider>
        </CashierAuthProvider>
      </AuthProvider>
    </AdminAuthProvider>
  </React.StrictMode>,
)
