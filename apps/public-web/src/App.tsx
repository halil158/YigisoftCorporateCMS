import { Routes, Route, Navigate } from 'react-router-dom'
import { PageView } from './pages/PageView'
import { NotFound } from './pages/NotFound'
import { Layout } from './components/Layout'
import { ThemeProvider } from './components/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/:slug" element={<PageView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  )
}
