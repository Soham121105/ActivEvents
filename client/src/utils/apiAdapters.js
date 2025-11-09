import axios from 'axios';

// Base configuration for all adapters
const config = {
  baseURL: 'http://localhost:3001/api'
};

// 1. Admin Adapter
export const adminAxios = axios.create(config);

// 2. Stall Adapter
export const stallAxios = axios.create(config);

// 3. Cashier Adapter
export const cashierAxios = axios.create(config);

// 4. Visitor Adapter
export const visitorAxios = axios.create(config);

// 5. Public Adapter (for things requiring no auth, like fetching club details by slug)
export const publicAxios = axios.create(config);
