import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';

// --- This is our "white-theme" styling ---

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background-color: #f9fafb; /* gray-50 */
    color: #1f2937; /* gray-800 */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  /* Simple scrollbar for a cleaner look */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  ::-webkit-scrollbar-thumb {
    background: #d1d5db; /* gray-300 */
    border-radius: 6px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #9ca3af; /* gray-400 */
  }
`;

const AppLayout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.nav`
  width: 240px;
  background-color: white;
  border-right: 1px solid #e5e7eb; /* gray-200 */
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
  padding: 24px;
  display: flex;
  flex-direction: column;
  /* Make sidebar sticky on mobile */
  @media (max-width: 768px) {
    position: fixed;
    height: 100%;
    /* We can add logic to hide/show it later */
  }
`;

const LogoText = styled.div`
  font-size: 1.5rem; /* 24px */
  font-weight: 700;
  color: #111827; /* gray-900 */
  margin-bottom: 32px;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin-bottom: 8px;

  /* This styles the <NavLink> component from react-router-dom */
  a {
    display: flex; /* Changed to flex for icons */
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    color: #374151; /* gray-700 */
    transition: all 0.2s;

    &:hover {
      background-color: #f3f4f6; /* gray-100 */
    }

    /* This is the "active" state, for the page we are currently on */
    &.active {
      background-color: #eef2ff; /* indigo-50 */
      color: #4338ca; /* indigo-700 */
    }
  }
`;

const MainContent = styled.main`
  flex-grow: 1; /* This makes it take up all remaining space */
  padding: 32px 48px;
  overflow-y: auto; /* Adds scrolling just to this content area */
  /* Add padding-left for mobile sidebar */
  @media (max-width: 768px) {
    padding: 16px;
    padding-left: 256px; /* 240px sidebar + 16px padding */
  }
`;

// --- This is our main React component ---

function App() {
  return (
    <AppLayout>
      <GlobalStyle />
      
      <Sidebar>
        <LogoText>ActivEvents</LogoText>
        
        <NavList>
          {/* This is a "NavLink" to our dashboard (home page). */}
          <NavItem>
            <NavLink to="/">
              {/* We can add an SVG icon here later */}
              Dashboard
            </NavLink>
          </NavItem>
          
          {/* --- THIS IS THE CHANGE ---
            We have REMOVED the "Stalls" link from the main sidebar.
            Stalls are now managed *inside* an Event.
          */}

        </NavList>
      </Sidebar>
      
      {/* This is the main content area where our pages will load */}
      <MainContent>
        <Outlet />
      </MainContent>

    </AppLayout>
  );
}

export default App;
