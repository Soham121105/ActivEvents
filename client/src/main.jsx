import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// --- Auth Providers ---
import { AuthProvider } from './context/AuthContext.jsx'
import { CashierAuthProvider } from './context/CashierAuthContext.jsx'
import { VisitorAuthProvider } from './context/VisitorAuthContext.jsx'

/* --- Admin --- */
import App from './App.jsx' 
import EventListPage from './pages/EventListPage.jsx'
import AddEventPage from './pages/AddEventPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import AddStallPage from './pages/AddStallPage.jsx'
import AddCashierPage from './pages/AddCashierPage.jsx'

/* --- Stall --- */
import StallLayout from './StallLayout.jsx'
import StallLoginPage from './pages/StallLoginPage.jsx'
// StallDashboardPage is now ABANDONED
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


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CashierAuthProvider>
        <VisitorAuthProvider>
          <BrowserRouter>
            <Routes>
              
              {/* --- ROUTE GROUP 1: THE ADMIN PANEL --- */}
              <Route path="/" element={<App />}>
                <Route index element={<EventListPage />} />
                <Route path="create-event" element={<AddEventPage />} />
                <Route path="event/:id" element={<EventDetailPage />} />
                <Route path="event/:id/add-stall" element={<AddStallPage />} />
                <Route path="event/:id/add-cashier" element={<AddCashierPage />} />
              </Route>

              {/* --- ROUTE GROUP 2: STALL LOGIN --- */}
              <Route path="/stall-login" element={<StallLoginPage />} />

              {/* --- ROUTE GROUP 3: THE STALL DASHBOARD --- */}
              <Route path="/stall" element={<StallLayout />}>
                {/* REMOVED: <Route path="dashboard" element={<StallDashboardPage />} /> */}
                <Route path="pos" element={<StallPosPage />} />
                <Route path="menu" element={<StallMenuPage />} />
                <Route path="transactions" element={<StallTransactionsPage />} />
                <Route path="qr" element={<StallQrPage />} />
                {/* ADD a redirect from the old dashboard link to the new POS page */}
                <Route path="dashboard" element={<StallPosPage />} /> 
              </Route>
              
              {/* --- ROUTE GROUP 4: CASHIER APP --- */}
              <Route path="/cashier-login" element={<CashierLoginPage />} />
              <Route path="/cashier/dashboard" element={<CashierDashboardPage />} />
              <Route path="/cashier/log" element={<CashierLogPage />} />
              
              {/* --- ROUTE GROUP 5: VISITOR APP --- */}
              <Route path="/v/login" element={<VisitorLoginPage />} />
              <Route path="/v/stall/:stall_id" element={<VisitorMenuPage />} />

            </Routes>
          </BrowserRouter>
        </VisitorAuthProvider>
      </CashierAuthProvider>
    </AuthProvider>
  </React.StrictMode>,
)
