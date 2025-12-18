
import React from 'react';

interface HeaderProps {
  userRole: string | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, onLogout }) => {
  return (
    <header className="bg-white border-b border-gray-100 py-5 px-8 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#bd0026] rounded-xl flex items-center justify-center shadow-lg shadow-red-100">
          <span className="text-white font-bold text-xl">O</span>
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">OfficeMate AI</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Enterprise Operations</p>
        </div>
      </div>
      
      {userRole && (
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-xs font-black text-gray-500 uppercase tracking-tighter">
              {userRole} Active
            </span>
          </div>
          <button 
            onClick={onLogout}
            className="text-xs font-black text-[#bd0026] hover:text-red-800 transition-colors uppercase border-b-2 border-transparent hover:border-[#bd0026] pb-0.5"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
