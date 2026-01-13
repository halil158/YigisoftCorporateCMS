import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { ToastProvider } from './components/ui'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PagesListPage } from './pages/PagesListPage'
import { PageCreatePage } from './pages/PageCreatePage'
import { PageEditPage } from './pages/PageEditPage'
import { MediaLibraryPage } from './pages/MediaLibraryPage'
import { ContactMessagesListPage } from './pages/ContactMessagesListPage'
import { ContactMessageDetailPage } from './pages/ContactMessageDetailPage'
import { NavigationPage } from './pages/NavigationPage'

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pages"
          element={
            <ProtectedRoute>
              <PagesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pages/new"
          element={
            <ProtectedRoute>
              <PageCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pages/:id"
          element={
            <ProtectedRoute>
              <PageEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/media"
          element={
            <ProtectedRoute>
              <MediaLibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact-messages"
          element={
            <ProtectedRoute>
              <ContactMessagesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact-messages/:id"
          element={
            <ProtectedRoute>
              <ContactMessageDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/navigation"
          element={
            <ProtectedRoute>
              <NavigationPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
