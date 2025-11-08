import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// --- 1. Import BOTH of our Auth Providers ---
import { AuthProvider } from './context/AuthContext.jsx'
import { CashierAuthProvider } from './context/CashierAuthContext.jsx'

/* --- Import Our "Admin" Layout & Pages --- */
import App from './App.jsx' 
import EventListPage from './pages/EventListPage.jsx'     // The Dashboard (/)
import AddEventPage from './pages/AddEventPage.jsx'       // The "Create Event" page (/create-event)
import EventDetailPage from './pages/EventDetailPage.jsx'   // The "Event Hub" (/event/:id)

// --- THESE ARE OUR NEW, EVENT-CENTRIC PAGES ---
import AddStallPage from './pages/AddStallPage.jsx'       // The "Create Stall" form
import AddCashierPage from './pages/AddCashierPage.jsx'   // The "Create Cashier" form


/* --- Import Our "Stall" Layout & Pages --- */
import StallLayout from './StallLayout.jsx'
import StallLoginPage from './pages/StallLoginPage.jsx'
import StallDashboardPage from './pages/stall/StallDashboardPage.jsx'
import StallMenuPage from './pages/stall/StallMenuPage.jsx'
import StallPosPage from './pages/stall/StallPosPage.jsx'
import StallQrPage from './pages/stall/StallQrPage.jsx'

/* --- Import Our "Cashier" Layout & Pages --- */
import CashierLoginPage from './pages/cashier/CashierLoginPage.jsx'
import CashierDashboardPage from './pages/cashier/CashierDashboardPage.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. WRAP THE APP IN BOTH PROVIDERS */}
    <AuthProvider>
      <CashierAuthProvider>
        <BrowserRouter>
          <Routes>
            
            {/* --- ROUTE GROUP 1: THE ADMIN PANEL (has admin sidebar) --- */}
            <Route path="/" element={<App />}>
              <Route index element={<EventListPage />} /> {/* Dashboard */}
              <Route path="create-event" element={<AddEventPage />} /> {/* Create Event Form */}
              <Route path="event/:id" element={<EventDetailPage />} /> {/* Event Hub */}
              
              {/* --- THESE ARE OUR NEW, CORRECTED ROUTES --- */}
              <Route path="event/:id/add-stall" element={<AddStallPage />} />
              <Route path="event/:id/add-cashier" element={<AddCashierPage />} />

              {/* We will add the Stall Sales page route here later */}
              {/* <Route path="stall/:stallId/sales" element={<StallSalesPage />} /> */}
            </Route>

            {/* --- ROUTE GROUP 2: STALL LOGIN (no sidebar) --- */}
            <Route path="/stall-login" element={<StallLoginPage />} />

            {/* --- ROUTE GROUP 3: THE STALL DASHBOARD (has stall sidebar) --- */}
            <Route path="/stall" element={<StallLayout />}>
              <Route path="dashboard" element={<StallDashboardPage />} />
              <Route path="pos" element={<StallPosPage />} />
              <Route path="menu" element={<StallMenuPage />} />
              <Route path="qr" element={<StallQrPage />} />
            </Route>
            
            {/* --- ROUTE GROUP 4: CASHIER APP (no sidebar) --- */}
            <Route path="/cashier-login" element={<CashierLoginPage />} />
            <Route path="/cashier/dashboard" element={<CashierDashboardPage />} />

          </Routes>
        </BrowserRouter>
      </CashierAuthProvider>
    </AuthProvider>
  </React.StrictMode>,
)
