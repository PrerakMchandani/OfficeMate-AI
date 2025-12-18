
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import EmployeePortal from './components/EmployeePortal';
import AdminPortal from './components/AdminPortal';
import { UserRole, Ticket, ReimbursementClaim, TicketStatus, RequestType } from './types';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);

  useEffect(() => {
    // Populate with refined initial data
    const initialTickets: Ticket[] = [
      {
        id: 'TIC-10294',
        employeeName: 'John Doe',
        type: RequestType.GENERAL,
        summary: 'Pantry supplies for meeting',
        description: 'Need coffee pods and sugar for Room 301.',
        location: 'Floor 3, Room 301',
        status: TicketStatus.RESOLVED,
        createdAt: new Date().toISOString(),
        priority: 'Low',
        comments: []
      },
      {
        id: 'TIC-99321',
        employeeName: 'John Doe',
        type: RequestType.IT,
        summary: 'VPN access troubleshooting',
        description: 'Cannot connect to global server since morning.',
        location: 'Remote Workspace',
        status: TicketStatus.OPEN,
        createdAt: new Date().toISOString(),
        priority: 'High',
        comments: []
      }
    ];

    const initialClaims: ReimbursementClaim[] = [
      {
        id: 'CLM-77821',
        employeeName: 'John Doe',
        billName: 'John Doe (Airtel)',
        months: ['January 2024'],
        totalAmount: 1100,
        eligibleAmount: 1100,
        excessAmount: 0,
        status: 'APPROVED',
        anomalies: [],
        aiReasoning: 'Validated: Amount within ₹1200 cap and name verified successfully.',
        createdAt: new Date().toISOString(),
        // Fix: Added missing 'type' property to match ReimbursementClaim interface
        type: 'Mobile'
      }
    ];

    setTickets(initialTickets);
    setClaims(initialClaims);
  }, []);

  const handleLogin = (role: UserRole, username: string) => {
    setCurrentUsername(username);
    setUserRole(role);
  };

  const handleAddTicket = (ticket: Ticket) => {
    setTickets(prev => [ticket, ...prev]);
  };

  const handleAddClaim = (claim: ReimbursementClaim) => {
    setClaims(prev => [claim, ...prev]);
  };

  const handleUpdateTicketStatus = (id: string, status: TicketStatus) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleUpdateClaimStatus = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleReopenTicket = (id: string, commentText: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        const newComment = {
          id: `COM-${Date.now()}`,
          author: currentUsername,
          text: commentText,
          timestamp: new Date().toISOString()
        };
        return { 
          ...t, 
          status: TicketStatus.OPEN, 
          isReopened: true, 
          comments: [...t.comments, newComment] 
        };
      }
      return t;
    }));
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col antialiased">
      <Header userRole={userRole} onLogout={() => { setUserRole(null); setCurrentUsername(''); }} />
      
      <main className="flex-grow">
        {!userRole ? (
          <Login onLogin={handleLogin} />
        ) : userRole === UserRole.EMPLOYEE ? (
          <EmployeePortal 
            username={currentUsername} 
            tickets={tickets} 
            claims={claims} 
            onAddTicket={handleAddTicket} 
            onAddClaim={handleAddClaim}
            onReopenTicket={handleReopenTicket}
          />
        ) : (
          <AdminPortal 
            username={currentUsername}
            tickets={tickets} 
            claims={claims} 
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onUpdateClaimStatus={handleUpdateClaimStatus}
          />
        )}
      </main>

      <footer className="py-12 px-8 text-center border-t border-gray-50 bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 opacity-30 grayscale grayscale-100">
            <div className="w-6 h-6 bg-gray-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs italic">O</span>
            </div>
            <span className="text-xs font-black tracking-widest text-gray-500 uppercase">OfficeMate AI</span>
          </div>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} Secured Enterprise Network • All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
