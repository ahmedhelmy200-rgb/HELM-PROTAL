
import React, { lazy } from 'react';

const Cases = lazy(() => import('./pages/Cases'));
const Clients = lazy(() => import('./pages/Clients'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Discover = lazy(() => import('./pages/Discover'));
const Documents = lazy(() => import('./pages/Documents'));
const Events = lazy(() => import('./pages/Events'));
const FounderDetail = lazy(() => import('./pages/FounderDetail'));
const Invoices = lazy(() => import('./pages/Invoices'));
const LegalTemplates = lazy(() => import('./pages/LegalTemplates'));
const Messages = lazy(() => import('./pages/Messages'));
const Network = lazy(() => import('./pages/Network'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Sessions = lazy(() => import('./pages/Sessions'));
const Settings = lazy(() => import('./pages/Settings'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Expenses = lazy(() => import('./pages/Expenses'));
const __Layout = lazy(() => import('./Layout.jsx'));

export const PAGES = {
  Cases,
  Clients,
  Dashboard,
  Discover,
  Documents,
  Events,
  FounderDetail,
  Invoices,
  LegalTemplates,
  Messages,
  Network,
  Notifications,
  Profile,
  Sessions,
  Settings,
  Tasks,
  Expenses,
};

export const pagesConfig = {
  mainPage: 'Dashboard',
  Pages: PAGES,
  Layout: __Layout,
};
