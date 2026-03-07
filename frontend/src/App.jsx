import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/agent/Dashboard'
import PersonaManagement from './pages/agent/persona/PersonaManagement'
import GuidelineManagement from './pages/agent/guideline/GuidelineManagement'
import WorkflowExecution from './pages/agent/workflow/WorkflowExecution'

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <MainLayout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/personas" element={<PersonaManagement />} />
                        <Route path="/guidelines" element={<GuidelineManagement />} />
                        <Route path="/workflows" element={<WorkflowExecution />} />
                    </Routes>
                </MainLayout>
            </Router>
        </QueryClientProvider>
    )
}

export default App
