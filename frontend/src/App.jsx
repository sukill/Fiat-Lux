import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/agent/Dashboard'
import PersonaManagement from './pages/agent/persona/PersonaManagement'
import GuidelineManagement from './pages/agent/guideline/GuidelineManagement'
import WorkflowExecution from './pages/agent/workflow/WorkflowExecution'
import BrowserPage from './pages/agent/storage/BrowserPage'

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Routes>
                    <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
                    <Route path="/personas" element={<MainLayout><PersonaManagement /></MainLayout>} />
                    <Route path="/guidelines" element={<MainLayout><GuidelineManagement /></MainLayout>} />
                    <Route path="/workflows" element={<MainLayout><WorkflowExecution /></MainLayout>} />
                    <Route path="/browser" element={<MainLayout fullBleed={true}><BrowserPage /></MainLayout>} />
                </Routes>
            </Router>
        </QueryClientProvider>
    )
}

export default App
