import React, { useState } from 'react';
import { LayoutDashboard, Users, Bell, Settings, Search, User, Sparkles, Filter, CheckCircle2, AlertCircle, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import GuestDirectory from "./GuestDirectory";

const initialGuests = [
  { id: '101', name: 'Alice Smith', tier: 'VIP', location: 'In Room', isGhost: false },
  { id: '102', name: 'Bob Johnson', tier: 'Standard', location: 'Lobby', isGhost: false },
  { id: '205', name: 'Charlie Davis', tier: 'Standard', location: 'Restaurant', isGhost: false },
  { id: '304', name: 'Diana Prince', tier: 'VIP', location: 'Pool & Spa', isGhost: false },
  { id: '410', name: 'Evan Wright', tier: 'Standard', location: 'In Room', isGhost: false }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [guests, setGuests] = useState(initialGuests);
  const [showVIPOnly, setShowVIPOnly] = useState(false);
  
  const [actions, setActions] = useState([
    { id: 1, title: 'System Online', message: 'Aura OS initialized and monitoring sensor data.', type: 'info', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);

  const triggerAction = (title, message, type) => {
    const newAction = { id: Date.now(), title, message, type, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setActions(prev => [newAction, ...prev]);
  };

  const dismissAction = (actionId) => {
    setActions(prevActions => prevActions.filter(action => action.id !== actionId));
  };

  const updateGuestLocation = (guestId, newLocation) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest || guest.location === newLocation || guest.isGhost) return; // Prevent tracking if Ghost Mode is on

    if (guest.location === 'In Room' && newLocation !== 'In Room') {
      triggerAction('Housekeeping Required', `Room ${guest.id} (${guest.name}) is now empty. Dispatch cleaning.`, 'routine');
    }
    if (newLocation === 'Lobby' && guest.tier === 'VIP') {
      triggerAction('VIP Arrival', `VIP Guest ${guest.name} just entered the Lobby. Prepare greeting.`, 'urgent');
    }

    setGuests(prevGuests => prevGuests.map(g => g.id === guestId ? { ...g, location: newLocation } : g));
  };

  // NEW: Toggle Ghost Mode
  const toggleGhostMode = (guestId) => {
    setGuests(prevGuests => prevGuests.map(g => g.id === guestId ? { ...g, isGhost: !g.isGhost } : g));
  };

  const simulateSensorUpdate = () => {
    const locations = ['Lobby', 'Restaurant', 'Pool & Spa', 'In Room'];
    const trackableGuests = guests.filter(g => !g.isGhost); // Only move guests who aren't in Ghost Mode
    if (trackableGuests.length === 0) return;
    
    const randomGuest = trackableGuests[Math.floor(Math.random() * trackableGuests.length)];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    updateGuestLocation(randomGuest.id, randomLocation);
  };

  const visibleGuests = showVIPOnly ? guests.filter(g => g.tier === 'VIP') : guests;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Aura OS
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Ubiquitous Guest Tracking</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavButton icon={<LayoutDashboard size={20} />} label="Live Monitor" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<Users size={20} />} label="Guest Directory" isActive={activeTab === 'guests'} onClick={() => setActiveTab('guests')} />
          
          <button 
            onClick={() => setActiveTab('actions')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 ${activeTab === 'actions' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'}`}
          >
            <div className="flex items-center gap-3">
              <Bell size={20} />
              <span>Action Queue</span>
            </div>
            {actions.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {actions.length}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <NavButton icon={<Settings size={20} />} label="System Settings" />
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-50/50">
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 z-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search guests, rooms..." className="w-full bg-slate-100 border-transparent text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'dashboard' && (
              <button 
                onClick={() => setShowVIPOnly(!showVIPOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border ${showVIPOnly ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Filter size={16} className={showVIPOnly ? 'text-indigo-600' : 'text-slate-400'} />
                {showVIPOnly ? 'Showing VIPs' : 'Filter VIPs'}
              </button>
            )}

            <button 
              onClick={simulateSensorUpdate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Sparkles size={16} />
              Simulate Movement
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <>
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-800">Zone Activity</h2>
                  <p className="text-slate-500 mt-1">Real-time environmental sensor data.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  System Live
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <ZoneCard title="Lobby" guests={visibleGuests.filter(g => g.location === 'Lobby')} onOverride={updateGuestLocation} onToggleGhost={toggleGhostMode} />
                <ZoneCard title="Restaurant" guests={visibleGuests.filter(g => g.location === 'Restaurant')} onOverride={updateGuestLocation} onToggleGhost={toggleGhostMode} />
                <ZoneCard title="Pool & Spa" guests={visibleGuests.filter(g => g.location === 'Pool & Spa')} onOverride={updateGuestLocation} onToggleGhost={toggleGhostMode} />
                <ZoneCard title="In Room" guests={visibleGuests.filter(g => g.location === 'In Room')} onOverride={updateGuestLocation} onToggleGhost={toggleGhostMode} />
              </div>
            </>
          )}

          {activeTab === 'guests' && (
    <GuestDirectory />
           )}

          {activeTab === 'actions' && (
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-800 mb-2">Action Queue</h2>
              <p className="text-slate-500 mb-8">Tasks automatically generated by environmental context.</p>
              
              <div className="flex flex-col gap-4">
                {actions.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500">
                    No pending actions. You're all caught up!
                  </div>
                ) : (
                  actions.map(action => (
                    <div key={action.id} className={`p-5 rounded-xl border flex gap-4 bg-white shadow-sm transition-all ${action.type === 'urgent' ? 'border-red-200' : 'border-slate-200'}`}>
                      <div className="mt-1">
                        <button 
                          onClick={() => dismissAction(action.id)}
                          title="Mark as complete and dismiss"
                          className="hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full cursor-pointer"
                        >
                          {action.type === 'urgent' ? <AlertCircle className="text-red-500 hover:text-red-600 transition-colors" size={24} /> : <CheckCircle2 className="text-indigo-500 hover:text-indigo-600 transition-colors" size={24} />}
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-bold ${action.type === 'urgent' ? 'text-red-700' : 'text-slate-800'}`}>{action.title}</h4>
                          <span className="text-xs font-medium text-slate-400">{action.time}</span>
                        </div>
                        <p className="text-slate-600 text-sm mt-1">{action.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ZoneCard({ title, guests, onOverride, onToggleGhost }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
          {guests.length} Active
        </span>
      </div>
      
      <div className="flex-1 flex flex-col gap-3 min-h-[150px] p-2 bg-slate-50 rounded-lg border border-slate-100">
        {guests.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium transition-all">
            No guests detected
          </div>
        ) : (
          guests.map(guest => <GuestCard key={guest.id} guest={guest} onOverride={onOverride} onToggleGhost={onToggleGhost} />)
        )}
      </div>
    </div>
  );
}

function GuestCard({ guest, onOverride, onToggleGhost }) {
  const isVIP = guest.tier === 'VIP';
  const zones = ['Lobby', 'Restaurant', 'Pool & Spa', 'In Room'];
  
  return (
    <div className={`p-3 rounded-lg flex flex-col gap-3 transition-all shadow-sm border ${guest.isGhost ? 'bg-slate-100 border-slate-200 opacity-75' : isVIP ? 'bg-white border-indigo-200 ring-1 ring-indigo-50' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-3 text-sm relative">
        <div className={`p-1.5 rounded-md ${guest.isGhost ? 'bg-slate-200 text-slate-400' : isVIP ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
          <User size={16} />
        </div>
        <div className="flex-1">
          <div className={`font-semibold ${guest.isGhost ? 'text-slate-500' : isVIP ? 'text-indigo-950' : 'text-slate-800'}`}>
            {guest.name}
          </div>
          <div className="text-xs text-slate-500 font-medium">Room {guest.id}</div>
        </div>
        
        {/* Ghost Mode Toggle Button */}
        <button 
          onClick={() => onToggleGhost(guest.id)}
          title="Toggle Guest Privacy Mode"
          className={`p-1.5 rounded-md transition-colors ${guest.isGhost ? 'bg-red-100 text-red-600' : 'hover:bg-slate-100 text-slate-300 hover:text-slate-500'}`}
        >
          <EyeOff size={14} />
        </button>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          {guest.isGhost ? 'Location Hidden' : 'Sensor Override'}
        </span>
        
        {/* Disable dropdown if Ghost mode is active */}
        <select 
          disabled={guest.isGhost}
          value={guest.location}
          onChange={(e) => onOverride(guest.id, e.target.value)}
          className={`text-xs border rounded-md px-2 py-1 transition-all ${guest.isGhost ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-100'}`}
        >
          {zones.map(zone => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
