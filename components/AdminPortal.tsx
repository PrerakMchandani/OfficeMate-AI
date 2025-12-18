
import React, { useState, useEffect } from 'react';
import { AdminSubRole, Ticket, TicketStatus, ReimbursementClaim, RequestType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface AdminPortalProps {
  username: string;
  tickets: Ticket[];
  claims: ReimbursementClaim[];
  onUpdateTicketStatus: (id: string, status: TicketStatus) => void;
  onUpdateClaimStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ username, tickets, claims, onUpdateTicketStatus, onUpdateClaimStatus }) => {
  const [role, setRole] = useState<AdminSubRole | null>(null);

  useEffect(() => {
    // Authenticated mapping
    if (username === 'SuperAdmin') {
      // Stay in null to allow selector if super admin
    } else if (username === 'FinAdmin') {
      setRole(AdminSubRole.FINANCE);
    } else if (username === 'GenAdmin') {
      setRole(AdminSubRole.GENERAL);
    } else if (username === 'ITAdmin') {
      setRole(AdminSubRole.IT);
    }
  }, [username]);

  if (!role && username === 'SuperAdmin') {
    return (
      <div className="max-w-5xl mx-auto py-20 px-6 text-center">
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">System Administration</h2>
        <p className="text-gray-400 font-medium mb-12">Authorized Personnel: <span className="text-[#bd0026]">{username}</span></p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <RoleSelector title="General" role={AdminSubRole.GENERAL} icon="🏢" color="#bd0026" onClick={setRole} />
          <RoleSelector title="IT Systems" role={AdminSubRole.IT} icon="🖥️" color="#333" onClick={setRole} />
          <RoleSelector title="Finance" role={AdminSubRole.FINANCE} icon="💰" color="#555" onClick={setRole} />
          <RoleSelector title="Super Ops" role={AdminSubRole.SUPER} icon="👑" color="#000" onClick={setRole} />
        </div>
      </div>
    );
  }

  const currentRole = role || AdminSubRole.SUPER;

  const filteredTickets = tickets.filter(t => {
    if (currentRole === AdminSubRole.GENERAL) return t.type === RequestType.GENERAL;
    if (currentRole === AdminSubRole.IT) return t.type === RequestType.IT;
    if (currentRole === AdminSubRole.SUPER) return true;
    return false;
  });

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[#bd0026] rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-red-100">
            {currentRole.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{currentRole} Portal</h2>
              {username === 'SuperAdmin' && (
                <button onClick={() => setRole(null)} className="text-[10px] font-black uppercase text-[#bd0026] bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100">Switch</button>
              )}
            </div>
            <p className="text-gray-400 font-medium italic">Authenticated session as {username}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-6 py-4 rounded-3xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Queue Status</span>
            <p className="text-xl font-black text-gray-900">{filteredTickets.length} Active</p>
          </div>
        </div>
      </div>

      {currentRole === AdminSubRole.SUPER ? (
        <SuperAdminDashboard tickets={tickets} claims={claims} />
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {(currentRole === AdminSubRole.GENERAL || currentRole === AdminSubRole.IT) && (
            <TicketManagementView tickets={filteredTickets} onUpdate={onUpdateTicketStatus} />
          )}
          {currentRole === AdminSubRole.FINANCE && (
            <FinanceManagementView claims={claims} onUpdate={onUpdateClaimStatus} />
          )}
        </div>
      )}
    </div>
  );
};

const RoleSelector = ({ title, role, icon, color, onClick }: any) => (
  <button 
    onClick={() => onClick(role)}
    className="p-10 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col items-center"
  >
    <div className="text-4xl mb-6 bg-gray-50 p-6 rounded-[2rem] group-hover:bg-[#bd0026] group-hover:text-white transition-all duration-500">{icon}</div>
    <h4 className="font-black text-xl text-gray-800 tracking-tight">{title}</h4>
  </button>
);

const TicketManagementView = ({ tickets, onUpdate }: any) => (
  <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
    <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
      <h3 className="font-black text-gray-900 text-xl tracking-tight uppercase">Operational Queue</h3>
      <div className="text-[10px] font-black text-[#bd0026] flex items-center gap-2">
        <span className="w-2 h-2 bg-[#bd0026] rounded-full animate-pulse"></span> LIVE FEED
      </div>
    </div>
    <div className="divide-y divide-gray-50">
      {tickets.length === 0 ? (
        <div className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest">Zero pending tickets in queue</div>
      ) : tickets.map((t: Ticket) => (
        <div key={t.id} className="p-8 hover:bg-red-50/10 transition-colors group flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-black text-[#bd0026] bg-red-50 px-3 py-1 rounded-full">#{t.id}</span>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${t.priority === 'High' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Priority: {t.priority}</span>
              {t.isReopened && <span className="px-3 py-1 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase">REOPENED</span>}
            </div>
            <h4 className="text-xl font-black text-gray-900">{t.summary}</h4>
            <p className="text-sm text-gray-400 font-medium">Requester: <span className="text-gray-900">{t.employeeName}</span> • Location: <span className="text-gray-900">{t.location || 'Unknown'}</span></p>
            <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100 font-medium leading-relaxed italic">
              "{t.description}"
            </div>
          </div>
          <div className="flex items-center gap-4">
            {t.status === TicketStatus.OPEN && (
              <button 
                onClick={() => onUpdate(t.id, TicketStatus.RESOLVED)}
                className="px-8 py-4 bg-[#bd0026] text-white text-sm font-black rounded-2xl shadow-lg shadow-red-100 hover:scale-105 transition-all"
              >
                MARK RESOLVED
              </button>
            )}
            <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${t.status === TicketStatus.RESOLVED ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {t.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FinanceManagementView = ({ claims, onUpdate }: any) => (
  <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
    <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
      <h3 className="font-black text-gray-900 text-xl tracking-tight uppercase">Claims Disbursement Audit</h3>
      <span className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-full">COMPLIANCE ENGINE ON</span>
    </div>
    <div className="divide-y divide-gray-50">
      {claims.length === 0 ? (
        <div className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest">No pending reimbursement requests</div>
      ) : claims.map((c: ReimbursementClaim) => (
        <div key={c.id} className="p-8 hover:bg-gray-50 transition-colors">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black text-[#bd0026]">CLAIM #{c.id}</span>
                <span className="text-lg font-black text-gray-900">{c.employeeName}</span>
              </div>
              <p className="text-sm font-medium text-gray-400">Target: {c.billName} • Period: {c.months.join(', ')}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-right min-w-[120px]">
              <p className="text-2xl font-black text-gray-900">₹{c.eligibleAmount}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disbursement</p>
            </div>
          </div>

          <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4 mb-6">
            <span className="text-xl">🤖</span>
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">AI Automated Insight</p>
              <p className="text-sm text-blue-900 font-medium leading-relaxed">{c.aiReasoning}</p>
            </div>
          </div>

          {c.anomalies.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {c.anomalies.map((a, i) => (
                <span key={i} className="px-4 py-1.5 bg-red-100 text-red-700 text-[10px] font-black rounded-lg border border-red-200">
                  FLAG: {a}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              {(c.status === 'PENDING' || c.status === 'NEEDS_REVIEW') && (
                <>
                  <button onClick={() => onUpdate(c.id, 'APPROVED')} className="px-8 py-3 bg-[#bd0026] text-white text-xs font-black rounded-xl hover:shadow-xl transition-all">APPROVE</button>
                  <button onClick={() => onUpdate(c.id, 'REJECTED')} className="px-8 py-3 bg-white text-gray-900 text-xs font-black rounded-xl border-2 border-gray-900 hover:bg-gray-50 transition-all">REJECT</button>
                </>
              )}
            </div>
            <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${c.status === 'APPROVED' ? 'bg-green-100 text-green-700' : c.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {c.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SuperAdminDashboard = ({ tickets, claims }: { tickets: Ticket[], claims: ReimbursementClaim[] }) => {
  const chartData = [
    { name: 'Admin', count: tickets.filter(t => t.type === RequestType.GENERAL).length },
    { name: 'IT', count: tickets.filter(t => t.type === RequestType.IT).length },
    { name: 'Fin', count: claims.length },
    { name: 'HR', count: tickets.filter(t => t.type === RequestType.HR).length },
  ];

  const COLORS = ['#bd0026', '#333333', '#666666', '#999999'];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <MetricCard label="Global Volume" value={tickets.length + claims.length} color="#bd0026" />
        <MetricCard label="Unresolved" value={tickets.filter(t => t.status === TicketStatus.OPEN).length} color="#000" />
        <MetricCard label="Disbursed (Est)" value={`₹${claims.filter(c => c.status === 'APPROVED').reduce((acc, c) => acc + c.eligibleAmount, 0)}`} color="#444" />
        <MetricCard label="Health Index" value="98%" color="#bd0026" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
          <h3 className="font-black text-gray-900 mb-8 text-xl tracking-tight uppercase">Operational Split</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                <Tooltip cursor={{ fill: '#fafafa' }} />
                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-50 text-[#bd0026] rounded-full flex items-center justify-center text-4xl mb-4 mx-auto">🛡️</div>
            <h4 className="text-2xl font-black mb-2 tracking-tighter">Security Heartbeat</h4>
            <p className="text-gray-400 font-medium mb-6">All endpoints responding normally</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl"><p className="text-xs font-black text-gray-400 uppercase">SSL Status</p><p className="font-black text-green-600">VALID</p></div>
              <div className="p-4 bg-gray-50 rounded-2xl"><p className="text-xs font-black text-gray-400 uppercase">Audit Logs</p><p className="font-black text-gray-900">SYNCED</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, color }: any) => (
  <div className="p-8 bg-white rounded-[2rem] shadow-sm border-t-8 transition-transform hover:-translate-y-1" style={{ borderTopColor: color }}>
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    <p className="text-4xl font-black text-gray-900 mt-2 tracking-tighter">{value}</p>
  </div>
);

export default AdminPortal;
