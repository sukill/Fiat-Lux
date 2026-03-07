import React from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

const MainLayout = ({ children }) => {
    return (
        <div className="flex h-screen bg-white text-slate-900 overflow-hidden selection:bg-blue-100">
            {/* Minimalist background */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white">
                <TopHeader />

                <main className="flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-100">
                    <div className="max-w-[1440px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
