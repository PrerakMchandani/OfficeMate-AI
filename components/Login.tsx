
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'SELECT_ROLE' | 'ENTER_DETAILS'>('SELECT_ROLE');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    setStep('ENTER_DETAILS');
    setError('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    if (selectedRole === UserRole.ADMIN) {
      const adminNames = ['FinAdmin', 'GenAdmin', 'ITAdmin', 'SuperAdmin'];
      if (!adminNames.includes(username)) {
        setError('Unauthorized Admin credentials. Access denied.');
        return;
      }
    }

    onLogin(selectedRole!, username);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] p-12 border border-gray-100">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-[#bd0026] rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-red-200 transform hover:rotate-3 transition-transform">
            <span className="text-white font-bold text-4xl">O</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter">OfficeMate AI</h2>
          <p className="text-gray-400 font-medium">Internal Operations Hub</p>
        </div>

        {step === 'SELECT_ROLE' ? (
          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelection(UserRole.EMPLOYEE)}
              className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-white hover:shadow-xl hover:-translate-y-1 border border-gray-100 rounded-3xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">👤</span>
                <div className="text-left">
                  <p className="font-black text-gray-900 uppercase text-xs tracking-widest">Portal Access</p>
                  <p className="text-lg font-bold text-gray-700">Employee Login</p>
                </div>
              </div>
              <span className="text-[#bd0026] group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <button
              onClick={() => handleRoleSelection(UserRole.ADMIN)}
              className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-white hover:shadow-xl hover:-translate-y-1 border border-gray-100 rounded-3xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">🛡️</span>
                <div className="text-left">
                  <p className="font-black text-gray-900 uppercase text-xs tracking-widest">System Access</p>
                  <p className="text-lg font-bold text-gray-700">Administrator Login</p>
                </div>
              </div>
              <span className="text-[#bd0026] group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <button 
              type="button"
              onClick={() => setStep('SELECT_ROLE')}
              className="text-xs font-black text-gray-400 hover:text-[#bd0026] uppercase tracking-widest flex items-center gap-2 mb-4"
            >
              ← Back to Role Selection
            </button>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                Enter {selectedRole === UserRole.ADMIN ? 'Admin ID' : 'Employee Username'}
              </label>
              <input
                type="text"
                value={username}
                autoFocus
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder={selectedRole === UserRole.ADMIN ? "e.g., FinAdmin" : "e.g., John Doe"}
                className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-[#bd0026] outline-none transition-all font-bold text-lg"
              />
              {error && (
                <div className="flex items-center gap-2 mt-3 px-4 py-2 bg-red-50 rounded-xl">
                  <span className="text-xs font-black text-[#bd0026]">{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-[#bd0026] hover:bg-[#9a001f] text-white font-black text-lg rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-95"
            >
              Sign In to {selectedRole} Portal
            </button>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-gray-50 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Secured by Enterprise SSO</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
