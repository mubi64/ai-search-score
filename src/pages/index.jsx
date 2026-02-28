import Layout from "./Layout.jsx";

import Start from "./Start";

import TopicSelection from "./TopicSelection";

import RunAnalysis from "./RunAnalysis";

import Dashboard from "./Dashboard";

import ReportDetail from "./ReportDetail";

import PromptReview from "./PromptReview";

import AdminDashboard from "./AdminDashboard";

import CompetitorReview from "./CompetitorReview";

import AdminLogin from "./AdminLogin";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Start: Start,
    
    TopicSelection: TopicSelection,
    
    RunAnalysis: RunAnalysis,
    
    Dashboard: Dashboard,
    
    ReportDetail: ReportDetail,
    
    PromptReview: PromptReview,
    
    AdminDashboard: AdminDashboard,
    
    CompetitorReview: CompetitorReview,
    
    AdminLogin: AdminLogin,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Start />} />
                
                
                <Route path="/Start" element={<Start />} />
                
                <Route path="/TopicSelection" element={<TopicSelection />} />
                
                <Route path="/RunAnalysis" element={<RunAnalysis />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/ReportDetail" element={<ReportDetail />} />
                
                <Route path="/PromptReview" element={<PromptReview />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/CompetitorReview" element={<CompetitorReview />} />
                
                <Route path="/AdminLogin" element={<AdminLogin />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}