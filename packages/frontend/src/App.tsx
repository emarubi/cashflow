import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import WorkflowsPage from '@/pages/Workflows'
import WorkflowDetailPage from '@/pages/Workflows/WorkflowDetail'
import CustomersPage from '@/pages/Customers'
import CustomerDetailPage from '@/pages/Customers/CustomerDetail'
import InvoicesPage from '@/pages/Invoices'
import InvoiceDetailPage from '@/pages/Invoices/InvoiceDetail'
import CreditNoteDetailPage from '@/pages/Invoices/CreditNoteDetail'
import ActionsPage from '@/pages/Actions'
import PaymentsPage from '@/pages/Payments'
import BankPage from '@/pages/Bank'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/:companySlug',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'workflows', element: <WorkflowsPage /> },
      { path: 'workflows/:id', element: <WorkflowDetailPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },
      { path: 'invoices', element: <InvoicesPage /> },
      { path: 'invoices/:id', element: <InvoiceDetailPage /> },
      { path: 'invoices/credit-notes/:id', element: <CreditNoteDetailPage /> },
      { path: 'actions', element: <ActionsPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'bank', element: <BankPage /> },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
