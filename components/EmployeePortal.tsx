
import React, { useState } from 'react';
import { RequestType, Ticket, TicketStatus, ReimbursementClaim, ReimbursementType } from '../types';
import { classifyRequest, validateClaim } from '../services/geminiService';

interface EmployeePortalProps {
  username: string;
  tickets: Ticket[];
  claims: ReimbursementClaim[];
  onAddTicket: (ticket: Ticket) => void;
  onAddClaim: (claim: ReimbursementClaim) => void;
  onReopenTicket: (id: string, comment: string) => void;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ username, tickets, claims, onAddTicket, onAddClaim, onReopenTicket }) => {
  const [activeWorkflow, setActiveWorkflow] = useState<RequestType | 'AUTOCLAIM' | null>(null);
  const [view, setView] = useState<'NEW' | 'DASHBOARD'>('NEW');
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
  const [lastClaim, setLastClaim] = useState<ReimbursementClaim | null>(null);
  
  // AutoClaim form state
  const [claimType, setClaimType] = useState<ReimbursementType>('WiFi');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [billFiles, setBillFiles] = useState<File[]>([]);

  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  const userTickets = tickets.filter(t => t.employeeName === username);
  const userClaims = claims.filter(c => c.employeeName === username);

  const monthsList = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve({
          base64: base64String.split(',')[1],
          mimeType: file.type
        });
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmitRequest = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setLastTicket(null);
    setLastClaim(null);

    try {
      const classification = await classifyRequest(input);
      const newTicket: Ticket = {
        id: `TIC-${Math.floor(Math.random() * 90000) + 10000}`,
        employeeName: username,
        type: classification.type,
        summary: classification.summary,
        description: input,
        location: classification.location,
        status: TicketStatus.OPEN,
        createdAt: new Date().toISOString(),
        priority: classification.priority,
        comments: []
      };
      onAddTicket(newTicket);
      setLastTicket(newTicket);
      setInput('');
      setActiveWorkflow(null);
    } catch (error) {
      console.error(error);
      alert("Failed to process request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidateClaim = async () => {
    if (billFiles.length === 0 || selectedMonths.length === 0) return;
    setIsProcessing(true);
    setLastClaim(null);

    try {
      const fileDataPromises = billFiles.map(file => fileToBase64(file));
      const files = await Promise.all(fileDataPromises);

      const result = await validateClaim(files, claimType, selectedMonths, username);

      const newClaim: ReimbursementClaim = {
        id: `CLM-${Math.floor(Math.random() * 90000) + 10000}`,
        employeeName: username,
        billName: result.details.customerName,
        months: selectedMonths,
        totalAmount: result.details.totalAmount,
        eligibleAmount: result.eligibleAmount,
        excessAmount: Math.max(0, result.details.totalAmount - result.eligibleAmount),
        // Map AI status to application status
        // Auto-Approved (AI) -> PENDING (Wait for Finance Admin final approval)
        // Needs Review (AI) -> NEEDS_REVIEW
        status: result.status === 'Auto-Approved' ? 'PENDING' : 'NEEDS_REVIEW',
        anomalies: result.status === 'Needs Review' ? ['Identity verification or documentation check flagged'] : [],
        aiReasoning: result.reasoning,
        createdAt: new Date().toISOString(),
        type: claimType,
        provider: result.details.provider
      };

      onAddClaim(newClaim);
      setLastClaim(newClaim);
    } catch (error) {
      console.error(error);
      alert("Neural extraction failed. Please ensure your documents are clear and try again.");
    } finally {
      setIsProcessing(false);
      setActiveWorkflow(null);
    }
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 2);
      setBillFiles(filesArray);
    }
  };

  const handleReopen = (id: string) => {
    if (!reopenReason.trim()) return;
    onReopenTicket(id, reopenReason);
    setReopeningId(null);
    setReopenReason('');
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Welcome, {username}</h2>
          <p className="text-gray-400 font-bold mt-2 uppercase text-xs tracking-[0.2em]">Operational Workspace</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
          <button 
            onClick={() => { setView('NEW'); setActiveWorkflow(null); setLastTicket(null); setLastClaim(null); }}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${view === 'NEW' ? 'bg-[#bd0026] text-white shadow-lg shadow-red-200' : 'text-gray-400 hover:text-gray-600'}`}
          >
            New Request
          </button>
          <button 
            onClick={() => setView('DASHBOARD')}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${view === 'DASHBOARD' ? 'bg-[#bd0026] text-white shadow-lg shadow-red-200' : 'text-gray-400 hover:text-gray-600'}`}
          >
            My Dashboard
          </button>
        </div>
      </div>

      {view === 'NEW' && (
        <div className="space-y-10">
          {!activeWorkflow && !lastTicket && !lastClaim && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <WorkflowCard 
                title="General Admin"
                desc="Stationery, pantry, logistics"
                icon="🏢"
                onClick={() => setActiveWorkflow(RequestType.GENERAL)}
              />
              <WorkflowCard 
                title="IT Support"
                desc="Hardware, software, access"
                icon="🖥️"
                onClick={() => setActiveWorkflow(RequestType.IT)}
              />
              <WorkflowCard 
                title="AutoClaim"
                desc="WiFi & Mobile Reimbursements"
                icon="🧾"
                onClick={() => setActiveWorkflow('AUTOCLAIM')}
              />
            </div>
          )}

          {activeWorkflow && activeWorkflow !== 'AUTOCLAIM' && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-50 max-w-3xl mx-auto animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8 pb-8 border-b border-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl">💬</div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">New {activeWorkflow} Request</h3>
                </div>
                <button onClick={() => setActiveWorkflow(null)} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#bd0026]">Cancel</button>
              </div>
              
              <div className="space-y-6">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your request... (e.g., 'Need 2 markers for Meeting Room 4')"
                  className="w-full h-44 p-8 bg-gray-50 border border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-red-50 focus:border-[#bd0026] outline-none transition-all text-lg font-medium"
                />
                <button
                  onClick={handleSubmitRequest}
                  disabled={isProcessing || !input.trim()}
                  className="w-full py-6 bg-[#bd0026] hover:bg-[#9a001f] text-white font-black text-xl rounded-[1.5rem] shadow-xl shadow-red-100 transition-all flex justify-center items-center gap-3 active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <><div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> AI ANALYZING...</>
                  ) : 'SUBMIT REQUEST'}
                </button>
              </div>
            </div>
          )}

          {activeWorkflow === 'AUTOCLAIM' && (
            <div className="bg-white rounded-[3rem] shadow-2xl p-12 border border-gray-50 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6">
              <div className="flex justify-between items-center mb-10 pb-8 border-b border-gray-50">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter">AutoClaim – AI Reimbursement Automation</h3>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Smart Document Verification</p>
                </div>
                <button onClick={() => setActiveWorkflow(null)} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#bd0026]">Cancel</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">1. Select Reimbursement Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['WiFi', 'Mobile'].map(type => (
                        <button
                          key={type}
                          onClick={() => setClaimType(type as any)}
                          className={`p-5 rounded-2xl font-black text-sm uppercase tracking-widest border-2 transition-all ${claimType === type ? 'bg-[#bd0026] text-white border-[#bd0026] shadow-lg shadow-red-100' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200'}`}
                        >
                          {type} Bill
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">2. Select Months Being Claimed</label>
                    <div className="grid grid-cols-4 gap-2">
                      {monthsList.map(month => (
                        <button
                          key={month}
                          onClick={() => toggleMonth(month)}
                          className={`px-3 py-3 rounded-xl text-[10px] font-bold uppercase border transition-all ${selectedMonths.includes(month) ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">3. Upload WiFi or Mobile Bill (Max 2 files)</label>
                    <div className="border-4 border-dashed border-gray-100 rounded-[2.5rem] p-10 text-center hover:border-[#bd0026] hover:bg-red-50/20 transition-all cursor-pointer relative">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*,application/pdf"
                        multiple
                      />
                      <div className="text-5xl mb-4">📄</div>
                      <div className="space-y-1">
                        {billFiles.length > 0 ? (
                          billFiles.map((f, i) => (
                            <p key={i} className="font-black text-gray-900 text-sm truncate px-4">{f.name}</p>
                          ))
                        ) : (
                          <p className="font-black text-gray-900 text-sm truncate px-4">Drop bill(s) here (PDF/Image)</p>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Max 2 files • 5MB total</p>
                    </div>
                  </div>

                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-2">
                    <p className="text-[10px] font-black text-[#bd0026] uppercase tracking-widest">Reimbursement Policy</p>
                    <ul className="text-[10px] font-bold text-red-900/70 space-y-1 list-disc list-inside uppercase tracking-tighter">
                      <li>MAX CLAIM: ₹1200 / MONTH</li>
                      <li>LIMIT: LAST 3 MONTHS RECORDS</li>
                      <li>SUBMISSION: MAX 2 MONTHS PER CLAIM</li>
                      <li>VERIFICATION: NAME MUST MATCH ON BILL</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleValidateClaim}
                disabled={isProcessing || billFiles.length === 0 || selectedMonths.length === 0}
                className="w-full mt-10 py-6 bg-[#bd0026] hover:bg-[#9a001f] text-white font-black text-xl rounded-[1.5rem] shadow-2xl shadow-red-100 transition-all flex justify-center items-center gap-4 disabled:opacity-30 disabled:grayscale active:scale-95"
              >
                {isProcessing ? (
                  <><div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> AI VALIDATING CLAIM...</>
                ) : 'VALIDATE CLAIM'}
              </button>
            </div>
          )}

          {lastTicket && (
            <div className="bg-white rounded-[3rem] shadow-2xl border border-[#bd0026] p-12 max-w-4xl mx-auto animate-in zoom-in-95">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center text-3xl">✓</div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Request Processed Successfully</h3>
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Reference ID: #{lastTicket.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <DetailCard label="Ticket Summary" value={lastTicket.summary} />
                <DetailCard label="Priority Tier" value={lastTicket.priority || 'Low'} />
                <DetailCard label="Detected Location" value={lastTicket.location || 'Not provided'} />
                <DetailCard label="Workflow" value={lastTicket.type} />
              </div>
              <button 
                onClick={() => { setLastTicket(null); setView('DASHBOARD'); }}
                className="w-full py-6 border-2 border-[#bd0026] text-[#bd0026] font-black rounded-2xl hover:bg-red-50 transition-all uppercase tracking-widest text-sm"
              >
                View Status in Dashboard
              </button>
            </div>
          )}

          {lastClaim && (
            <div className="bg-white rounded-[3rem] shadow-2xl border-l-[12px] border-[#bd0026] p-12 max-w-4xl mx-auto animate-in slide-in-from-right-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter">AI Verification Report</h3>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Claim ID: {lastClaim.id}</p>
                </div>
                <div className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${lastClaim.status === 'NEEDS_REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {lastClaim.status === 'NEEDS_REVIEW' ? 'Needs Finance Review' : 'Auto-Approved by AI'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <StatCard label="Extracted Bill Amount" value={`₹${lastClaim.totalAmount}`} />
                <StatCard label="Max Eligible Amount" value={`₹${lastClaim.eligibleAmount}`} accent />
                <StatCard label="Non-Eligible Excess" value={`₹${lastClaim.excessAmount}`} />
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <span className="text-[10px] font-black text-[#bd0026] uppercase tracking-[0.2em] block mb-3">Automated Decision Reasoning</span>
                  <p className="text-lg font-bold text-gray-800 leading-relaxed italic">"{lastClaim.aiReasoning}"</p>
                </div>

                {lastClaim.anomalies.length > 0 && (
                  <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] block mb-4">Discrepancy Flags</span>
                    <ul className="space-y-3">
                      {lastClaim.anomalies.map((a, i) => (
                        <li key={i} className="flex items-center gap-3 text-red-900 font-black text-sm uppercase tracking-tight">
                          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button 
                onClick={() => { setLastClaim(null); setView('DASHBOARD'); }}
                className="w-full mt-10 py-6 bg-gray-900 text-white font-black text-sm rounded-[1.5rem] hover:bg-black transition-all uppercase tracking-widest shadow-xl"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'DASHBOARD' && (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6">
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Operational History</h3>
              <div className="h-[2px] bg-gray-100 flex-grow"></div>
            </div>
            {userTickets.length === 0 ? (
              <EmptyState title="No active operational requests found." />
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {userTickets.map(t => (
                  <div key={t.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-8 group hover:shadow-2xl transition-all">
                    <div className="space-y-3 flex-grow">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] font-black text-gray-400">ID: {t.id}</span>
                        <span className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${t.type === RequestType.IT ? 'bg-gray-900 text-white' : 'bg-[#bd0026] text-white'}`}>{t.type}</span>
                        {t.isReopened && <span className="px-4 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase">Reopened</span>}
                      </div>
                      <p className="font-black text-gray-900 text-2xl tracking-tight">{t.summary}</p>
                      <p className="text-sm text-gray-400 font-medium italic truncate max-w-xl">"{t.description}"</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <StatusBadge status={t.status} />
                      {t.status === TicketStatus.RESOLVED && !reopeningId && (
                        <button 
                          onClick={() => setReopeningId(t.id)}
                          className="px-6 py-3 text-[#bd0026] font-black text-[10px] uppercase tracking-widest border-2 border-[#bd0026] rounded-xl hover:bg-red-50 transition-all"
                        >
                          Clarification Needed
                        </button>
                      )}
                    </div>

                    {reopeningId === t.id && (
                      <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center p-6 z-[60] backdrop-blur-sm">
                        <div className="bg-white p-12 rounded-[3rem] max-w-xl w-full shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] border border-gray-100">
                          <h4 className="text-3xl font-black text-gray-900 tracking-tighter mb-4">Request Reopening</h4>
                          <p className="text-gray-400 text-sm font-medium mb-8 uppercase tracking-widest">State the reason for manual intervention</p>
                          <textarea 
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            placeholder="Add your comments here..."
                            className="w-full h-40 p-6 bg-gray-50 border border-gray-100 rounded-[1.5rem] mb-8 focus:ring-4 focus:ring-red-50 outline-none text-lg font-medium"
                          />
                          <div className="flex gap-6">
                            <button onClick={() => setReopeningId(null)} className="flex-1 py-4 font-black text-gray-400 uppercase text-xs tracking-widest">Discard</button>
                            <button onClick={() => handleReopen(t.id)} className="flex-1 py-4 bg-[#bd0026] text-white font-black rounded-2xl shadow-xl shadow-red-100 uppercase text-xs tracking-widest">Confirm Reopen</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Financial Ledger</h3>
              <div className="h-[2px] bg-gray-100 flex-grow"></div>
            </div>
            {userClaims.length === 0 ? (
              <EmptyState title="No financial claims found in recent periods." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {userClaims.map(c => (
                  <div key={c.id} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] font-black text-gray-300">#{c.id}</span>
                      <ClaimStatusBadge status={c.status} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-4xl tracking-tighter">₹{c.eligibleAmount}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{c.months.join(' & ')} Reimbursement</p>
                    </div>
                    <div className="h-[1px] bg-gray-50"></div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed italic opacity-80 line-clamp-2">"{c.aiReasoning}"</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const WorkflowCard = ({ title, desc, icon, onClick }: any) => (
  <button
    onClick={onClick}
    className="p-10 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm text-left hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative"
  >
    <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl mb-8 bg-gray-50 group-hover:bg-[#bd0026] group-hover:text-white transition-all duration-500 shadow-sm">
      {icon}
    </div>
    <h4 className="font-black text-2xl text-gray-900 mb-2 tracking-tight">{title}</h4>
    <p className="text-sm text-gray-400 font-medium leading-relaxed uppercase tracking-tighter">{desc}</p>
    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
      <div className="text-6xl text-[#bd0026] font-black">→</div>
    </div>
  </button>
);

const DetailCard = ({ label, value }: any) => (
  <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{label}</span>
    <p className="text-lg font-bold text-gray-800">{value}</p>
  </div>
);

const StatCard = ({ label, value, accent }: any) => (
  <div className={`p-8 rounded-[2rem] border ${accent ? 'bg-[#bd0026] border-[#bd0026] shadow-2xl shadow-red-200' : 'bg-gray-50 border-gray-100'}`}>
    <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${accent ? 'text-white/70' : 'text-gray-400'}`}>{label}</span>
    <p className={`text-3xl font-black tracking-tighter ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
);

const EmptyState = ({ title }: any) => (
  <div className="p-24 text-center bg-gray-50/50 border-4 border-dashed border-gray-100 rounded-[3rem]">
    <div className="text-6xl mb-6 grayscale opacity-30">📭</div>
    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">{title}</p>
  </div>
);

const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const styles: any = {
    [TicketStatus.OPEN]: 'bg-amber-100 text-amber-700',
    [TicketStatus.RESOLVED]: 'bg-green-100 text-green-700 border border-green-200',
    [TicketStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
    [TicketStatus.REJECTED]: 'bg-red-100 text-[#bd0026]',
    [TicketStatus.COMPLETED]: 'bg-gray-100 text-gray-700'
  };
  return (
    <span className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${styles[status] || 'bg-gray-50'}`}>
      {status}
    </span>
  );
};

const ClaimStatusBadge = ({ status }: { status: any }) => {
  const styles: any = {
    'APPROVED': 'bg-green-100 text-green-700',
    'REJECTED': 'bg-red-100 text-[#bd0026]',
    'PENDING': 'bg-amber-100 text-amber-700',
    'NEEDS_REVIEW': 'bg-orange-100 text-orange-700'
  };
  return (
    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
      {status === 'PENDING' ? 'Validated (AI)' : status}
    </span>
  );
};

export default EmployeePortal;
