import React from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

const MainLayout = ({ children, fullBleed = false }) => {
    return (
        <div id="main-layout" className="flex h-screen bg-white text-slate-900 overflow-hidden selection:bg-blue-100">
            {/* Minimalist background */}
            <Sidebar />

            <div id="main-content-area" className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white">
                <TopHeader />

                <main className={`flex-1 overflow-y-auto bg-slate-100 ${fullBleed ? '' : 'p-8 lg:p-12'}`}>
                    <div className={fullBleed ? 'h-full' : 'max-w-[1440px] mx-auto'}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
