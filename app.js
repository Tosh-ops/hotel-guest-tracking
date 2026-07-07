// ============================================================
// CONFIG — change this if you deploy the Django backend somewhere
// (e.g. Render, Railway). Keep it as localhost while developing.
// ============================================================
const CONFIG = {
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'http://127.0.0.1:8000', // <-- replace with your deployed backend URL, e.g. 'https://your-app.onrender.com'
};

// ============================================================
// STATE
// ============================================================
const state = {
  accessToken: null,
  refreshToken: null,
  role: null,
  username: null,
  firstName: null,
  activeTab: null,
  simulatedOffline: false,
  rooms: [],
  guests: [],
  checkins: [],
  serviceRequests: [],
  reports: null,
};

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================
const AUTH_KEY = 'kilima_auth';
const QUEUE_KEY = 'kilima_offline_queue';

function saveAuth() {
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    role: state.role,
    username: state.username,
    firstName: state.firstName,
  }));
}

function loadAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    Object.assign(state, data);
    return !!state.accessToken;
  } catch {
    return false;
  }
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  state.accessToken = null;
  state.refreshToken = null;
  state.role = null;
  state.username = null;
  state.firstName = null;
}

function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; }
  catch { return []; }
}

function setQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function queueLength() {
  return getQueue().length;
}

// ============================================================
// CONNECTIVITY
// ============================================================
function isOffline() {
  return state.simulatedOffline || !navigator.onLine;
}

function toggleSimulatedOffline() {
  state.simulatedOffline = !state.simulatedOffline;
  if (!state.simulatedOffline) {
    flushQueue();
  }
  renderConnectivityPill();
  renderOfflineBanner();
}

function renderConnectivityPill() {
  const pill = document.getElementById('connectivityPill');
  const label = document.getElementById('connectivityLabel');
  if (isOffline()) {
    pill.className = 'status-pill offline';
    label.textContent = 'Offline';
  } else {
    pill.className = 'status-pill online';
    label.textContent = 'Online';
  }
}

window.addEventListener('online', () => { renderConnectivityPill(); renderOfflineBanner(); flushQueue(); });
window.addEventListener('offline', () => { renderConnectivityPill(); renderOfflineBanner(); });

// ============================================================
// TOASTS
// ============================================================
function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : type === 'pending' ? ' pending' : '');
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

// ============================================================
// API WRAPPER
// ============================================================
async function apiRequest(path, { method = 'GET', body = null, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && state.accessToken) headers['Authorization'] = `Bearer ${state.accessToken}`;

  const res = await fetch(`${CONFIG.API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiRequest(path, { method, body, auth });
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    const message = data?.detail || firstErrorMessage(data) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function firstErrorMessage(data) {
  if (!data || typeof data !== 'object') return null;
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key]) && data[key].length) return `${key}: ${data[key][0]}`;
  }
  return null;
}

async function tryRefreshToken() {
  if (!state.refreshToken) return false;
  try {
    const res = await fetch(`${CONFIG.API_BASE}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: state.refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    state.accessToken = data.access;
    saveAuth();
    return true;
  } catch {
    return false;
  }
}

// A mutating request that queues itself for later if we're offline.
// `applyLocally` runs immediately so the UI updates optimistically.
async function apiMutate(path, method, body, { description, applyLocally } = {}) {
  if (isOffline()) {
    const queue = getQueue();
    queue.push({ id: crypto.randomUUID(), path, method, body, description, createdAt: Date.now() });
    setQueue(queue);
    if (applyLocally) applyLocally();
    toast(`Offline — saved locally: ${description}`, 'pending');
    renderOfflineBanner();
    return { queued: true };
  }
  const result = await apiRequest(path, { method, body });
  if (applyLocally) applyLocally();
  return result;
}

async function flushQueue() {
  let queue = getQueue();
  if (!queue.length || isOffline()) return;

  toast(`Syncing ${queue.length} offline change${queue.length > 1 ? 's' : ''}...`);
  const remaining = [];
  for (const item of queue) {
    try {
      await apiRequest(item.path, { method: item.method, body: item.body });
    } catch (err) {
      remaining.push(item);
    }
  }
  setQueue(remaining);
  renderOfflineBanner();

  if (remaining.length === 0) {
    toast('All offline changes synced successfully.');
  } else {
    toast(`${remaining.length} change(s) could not sync yet.`, 'error');
  }
  refreshCurrentPanelData();
}

function renderOfflineBanner() {
  const existing = document.getElementById('offlineBannerSlot');
  if (existing) existing.remove();
  const main = document.getElementById('mainContent');
  if (!main) return;
  const qlen = queueLength();
  if (!isOffline() && qlen === 0) return;

  const banner = document.createElement('div');
  banner.id = 'offlineBannerSlot';
  banner.className = 'offline-banner';
  if (isOffline()) {
    banner.innerHTML = `<span>You're working offline. Room and housekeeping updates are saved on this device and will sync automatically once you're back online. <b>${qlen}</b> change(s) waiting.</span>`;
  } else {
    banner.innerHTML = `<span>Back online — syncing <b>${qlen}</b> pending change(s)...</span>`;
  }
  main.prepend(banner);
}

// ============================================================
// LOGIN / LOGOUT
// ============================================================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorBox = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmitBtn');
  errorBox.classList.add('hidden');
  submitBtn.textContent = 'Signing in...';

  try {
    const res = await fetch(`${CONFIG.API_BASE}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Invalid username or password.');

    state.accessToken = data.access;
    state.refreshToken = data.refresh;
    state.role = data.role;
    state.username = data.username;
    state.firstName = data.first_name || data.username;
    saveAuth();
    enterApp();
  } catch (err) {
    errorBox.textContent = err.message.includes('fetch')
      ? `Can't reach the server at ${CONFIG.API_BASE}. Is the Django backend running?`
      : err.message;
    errorBox.classList.remove('hidden');
  } finally {
    submitBtn.textContent = 'Sign in';
  }
});

document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('connectivityPill').addEventListener('click', toggleSimulatedOffline);

function logout() {
  clearAuth();
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginForm').reset();
}

function enterApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('userName').textContent = state.firstName;
  document.getElementById('userRoleBadge').textContent = state.role;
  renderConnectivityPill();
  buildTabsForRole();
}

// ============================================================
// TABS PER ROLE
// ============================================================
const TABS_BY_ROLE = {
  receptionist: [
    { id: 'rooms', label: 'Room Board' },
    { id: 'checkin', label: 'Check-in' },
    { id: 'stays', label: 'Active Stays' },
  ],
  housekeeping: [
    { id: 'rooms', label: 'Room Board' },
    { id: 'requests', label: 'Service Requests' },
  ],
  manager: [
    { id: 'overview', label: 'Overview' },
    { id: 'rooms', label: 'Room Board' },
  ],
};

function buildTabsForRole() {
  const tabs = TABS_BY_ROLE[state.role] || [];
  const tabBar = document.getElementById('tabs');
  tabBar.innerHTML = tabs.map(t =>
    `<button class="tab-btn" data-tab="${t.id}">${t.label}</button>`
  ).join('');
  tabBar.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  switchTab(tabs[0]?.id);
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  refreshCurrentPanelData();
}

function refreshCurrentPanelData() {
  const panels = {
    rooms: renderRoomsPanel,
    checkin: renderCheckinPanel,
    stays: renderStaysPanel,
    requests: renderRequestsPanel,
    overview: renderOverviewPanel,
  };
  const fn = panels[state.activeTab];
  if (fn) fn();
}

// ============================================================
// DATA FETCHING
// ============================================================
async function fetchRooms() {
  const data = await apiRequest('/api/hotel/rooms/');
  state.rooms = data.results || data;
  return state.rooms;
}
async function fetchGuests() {
  const data = await apiRequest('/api/hotel/guests/');
  state.guests = data.results || data;
  return state.guests;
}
async function fetchCheckins() {
  const data = await apiRequest('/api/hotel/checkins/');
  state.checkins = data.results || data;
  return state.checkins;
}
async function fetchServiceRequests() {
  const data = await apiRequest('/api/hotel/service-requests/');
  state.serviceRequests = data.results || data;
  return state.serviceRequests;
}
async function fetchReports() {
  const [occupancy, revenue, daily, cleaning, maintenance] = await Promise.all([
    apiRequest('/api/reports/occupancy/'),
    apiRequest('/api/reports/revenue/'),
    apiRequest('/api/reports/daily-activity/'),
    apiRequest('/api/reports/cleaning/'),
    apiRequest('/api/reports/maintenance/'),
  ]);
  state.reports = { occupancy, revenue, daily, cleaning, maintenance };
  return state.reports;
}

// ============================================================
// ROOM BOARD (shared across roles)
// ============================================================
async function renderRoomsPanel() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="panel-header">
      <div><h2>Room Board</h2><p class="sub">Live status of every room. ${state.role === 'housekeeping' ? 'Tap a room to update its status.' : 'Color shows current status.'}</p></div>
    </div>
    <div class="room-grid" id="roomGrid"><p class="empty-row">Loading rooms...</p></div>
  `;
  renderOfflineBanner();

  try {
    if (isOffline() && state.rooms.length) {
      // use cached rooms
    } else {
      await fetchRooms();
    }
  } catch (err) {
    toast(err.message, 'error');
  }
  drawRoomGrid();
}

function drawRoomGrid() {
  const grid = document.getElementById('roomGrid');
  if (!grid) return;
  const queue = getQueue();
  if (!state.rooms.length) {
    grid.innerHTML = '<p class="empty-row">No rooms found.</p>';
    return;
  }
  grid.innerHTML = state.rooms.map(room => {
    const pendingChange = queue.find(q => q.path === `/api/hotel/rooms/${room.id}/`);
    const clickable = state.role === 'housekeeping';
    return `
      <div class="keytag status-${room.status} ${clickable ? 'clickable' : ''}" data-room-id="${room.id}">
        ${pendingChange ? '<span class="pending-badge">Pending sync</span>' : ''}
        <div class="room-number">${room.room_number}</div>
        <div class="room-type">${room.room_type}</div>
        <div class="room-price">KES ${Number(room.price_per_night).toLocaleString()}/night</div>
        <div class="status-tag status-${room.status}">${room.status}</div>
      </div>
    `;
  }).join('');

  if (state.role === 'housekeeping') {
    grid.querySelectorAll('.keytag').forEach(tile => {
      tile.addEventListener('click', () => openRoomStatusModal(Number(tile.dataset.roomId)));
    });
  }
}

function openRoomStatusModal(roomId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  const statuses = ['available', 'occupied', 'cleaning', 'maintenance'];
  openModal(`
    <h3>Room ${room.room_number}</h3>
    <p class="hint">Update the housekeeping status for this room.</p>
    <div class="field">
      <label>Status</label>
      <select id="statusSelect">
        ${statuses.map(s => `<option value="${s}" ${s === room.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" id="modalCancel">Cancel</button>
      <button class="btn-brass" id="modalSave">Save status</button>
    </div>
  `);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalSave').addEventListener('click', async () => {
    const newStatus = document.getElementById('statusSelect').value;
    try {
      await apiMutate(`/api/hotel/rooms/${room.id}/`, 'PATCH', { status: newStatus }, {
        description: `Room ${room.room_number} → ${newStatus}`,
        applyLocally: () => { room.status = newStatus; },
      });
      toast(`Room ${room.room_number} marked ${newStatus}.`);
      closeModal();
      drawRoomGrid();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

// ============================================================
// RECEPTIONIST — CHECK-IN
// ============================================================
async function renderCheckinPanel() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="panel-header">
      <div><h2>Guest Check-in</h2><p class="sub">Register a guest and assign them an available room.</p></div>
    </div>
    <div class="card">
      <h3>New guest</h3>
      <form id="checkinForm">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="field"><label>First name</label><input type="text" id="ciFirstName" required></div>
          <div class="field"><label>Last name</label><input type="text" id="ciLastName" required></div>
          <div class="field"><label>Phone</label><input type="text" id="ciPhone" placeholder="07XXXXXXXX" required></div>
          <div class="field"><label>Email (optional)</label><input type="email" id="ciEmail"></div>
          <div class="field"><label>ID / Passport number</label><input type="text" id="ciIdNumber" required></div>
          <div class="field">
            <label>Room</label>
            <select id="ciRoom" required></select>
          </div>
          <div class="field"><label>Expected checkout date</label><input type="date" id="ciCheckoutDate" required></div>
        </div>
        <button type="submit" class="btn-brass" ${isOffline() ? 'disabled title="Check-in needs a live connection"' : ''}>Check in guest</button>
        ${isOffline() ? '<p class="hint" style="margin-top:10px;color:var(--occupied)">Check-ins need a live connection, to make sure two receptionists never assign the same room. Reconnect to continue.</p>' : ''}
      </form>
    </div>
    <div class="card">
      <h3>Guest directory</h3>
      <table>
        <thead><tr><th>Name</th><th>Phone</th><th>ID Number</th></tr></thead>
        <tbody id="guestTableBody"><tr><td colspan="3" class="empty-row">Loading...</td></tr></tbody>
      </table>
    </div>
  `;
  renderOfflineBanner();

  try {
    await Promise.all([fetchRooms(), fetchGuests()]);
  } catch (err) {
    toast(err.message, 'error');
  }

  const roomSelect = document.getElementById('ciRoom');
  const availableRooms = state.rooms.filter(r => r.status === 'available');
  roomSelect.innerHTML = availableRooms.length
    ? availableRooms.map(r => `<option value="${r.id}">${r.room_number} — ${r.room_type} (KES ${Number(r.price_per_night).toLocaleString()})</option>`).join('')
    : '<option value="">No available rooms</option>';

  const guestBody = document.getElementById('guestTableBody');
  guestBody.innerHTML = state.guests.length
    ? state.guests.map(g => `<tr><td>${g.first_name} ${g.last_name}</td><td>${g.phone}</td><td>${g.id_number}</td></tr>`).join('')
    : '<tr><td colspan="3" class="empty-row">No guests registered yet.</td></tr>';

  document.getElementById('checkinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isOffline()) { toast('Reconnect to check in a guest.', 'error'); return; }
    const roomId = Number(roomSelect.value);
    if (!roomId) { toast('No available room selected.', 'error'); return; }

    try {
      const guest = await apiRequest('/api/hotel/guests/', {
        method: 'POST',
        body: {
          first_name: document.getElementById('ciFirstName').value,
          last_name: document.getElementById('ciLastName').value,
          phone: document.getElementById('ciPhone').value,
          email: document.getElementById('ciEmail').value,
          id_number: document.getElementById('ciIdNumber').value,
        },
      });
      await apiRequest('/api/hotel/checkins/', {
        method: 'POST',
        body: {
          guest: guest.id,
          room: roomId,
          expected_checkout: document.getElementById('ciCheckoutDate').value,
        },
      });
      toast(`${guest.first_name} ${guest.last_name} checked in successfully.`);
      renderCheckinPanel();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

// ============================================================
// RECEPTIONIST — ACTIVE STAYS / CHECK-OUT
// ============================================================
async function renderStaysPanel() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="panel-header">
      <div><h2>Active Stays</h2><p class="sub">Guests currently checked in. Process a check-out when they leave.</p></div>
    </div>
    <div class="card">
      <table>
        <thead><tr><th>Guest</th><th>Room</th><th>Checked in</th><th>Expected checkout</th><th></th></tr></thead>
        <tbody id="staysTableBody"><tr><td colspan="5" class="empty-row">Loading...</td></tr></tbody>
      </table>
    </div>
  `;
  renderOfflineBanner();

  try {
    await Promise.all([fetchCheckins(), fetchGuests(), fetchRooms()]);
  } catch (err) {
    toast(err.message, 'error');
  }

  const active = state.checkins.filter(c => c.active);
  const body = document.getElementById('staysTableBody');
  body.innerHTML = active.length ? active.map(c => {
    const guest = state.guests.find(g => g.id === c.guest);
    const room = state.rooms.find(r => r.id === c.room);
    return `
      <tr>
        <td>${guest ? guest.first_name + ' ' + guest.last_name : 'Guest #' + c.guest}</td>
        <td>${room ? room.room_number : c.room}</td>
        <td>${new Date(c.check_in_date).toLocaleDateString()}</td>
        <td>${c.expected_checkout}</td>
        <td><button class="btn-ghost btn-small" data-checkin-id="${c.id}">Check out</button></td>
      </tr>
    `;
  }).join('') : '<tr><td colspan="5" class="empty-row">No active stays right now.</td></tr>';

  body.querySelectorAll('button[data-checkin-id]').forEach(btn => {
    btn.addEventListener('click', () => openCheckoutModal(Number(btn.dataset.checkinId)));
  });
}

function openCheckoutModal(checkinId) {
  const checkin = state.checkins.find(c => c.id === checkinId);
  const guest = state.guests.find(g => g.id === checkin.guest);
  const room = state.rooms.find(r => r.id === checkin.room);
  const nights = Math.max(1, Math.round((new Date(checkin.expected_checkout) - new Date(checkin.check_in_date)) / 86400000));
  const suggestedBill = room ? (Number(room.price_per_night) * nights).toFixed(2) : '';

  openModal(`
    <h3>Check out ${guest ? guest.first_name + ' ' + guest.last_name : 'Guest'}</h3>
    <p class="hint">Room ${room ? room.room_number : ''} will be marked for cleaning after checkout.</p>
    <div class="field">
      <label>Total bill (KES)</label>
      <input type="number" id="billAmount" min="0" step="0.01" value="${suggestedBill}">
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" id="modalCancel">Cancel</button>
      <button class="btn-brass" id="modalConfirm" ${isOffline() ? 'disabled title="Checkout needs a live connection"' : ''}>Confirm checkout</button>
    </div>
    ${isOffline() ? '<p class="hint" style="color:var(--occupied)">Checkout needs a live connection since it finalizes billing.</p>' : ''}
  `);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalConfirm').addEventListener('click', async () => {
    try {
      await apiRequest('/api/hotel/checkouts/', {
        method: 'POST',
        body: { checkin: checkin.id, total_bill: document.getElementById('billAmount').value },
      });
      toast('Guest checked out successfully.');
      closeModal();
      renderStaysPanel();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

// ============================================================
// HOUSEKEEPING — SERVICE REQUESTS
// ============================================================
async function renderRequestsPanel() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="panel-header">
      <div><h2>Service Requests</h2><p class="sub">Guest requests logged against a room. Mark complete when done.</p></div>
    </div>
    <div class="card">
      <h3>Log a new request</h3>
      <form id="requestForm" class="inline-form">
        <div class="field"><label>Room</label><select id="reqRoom"></select></div>
        <div class="field" style="flex:2"><label>Description</label><input type="text" id="reqDescription" placeholder="e.g. Extra towels requested" required></div>
        <button type="submit" class="btn-brass">Log request</button>
      </form>
    </div>
    <div class="card">
      <table>
        <thead><tr><th>Room</th><th>Description</th><th>Requested</th><th>Status</th><th></th></tr></thead>
        <tbody id="requestsTableBody"><tr><td colspan="5" class="empty-row">Loading...</td></tr></tbody>
      </table>
    </div>
  `;
  renderOfflineBanner();

  try {
    await Promise.all([fetchRooms(), fetchServiceRequests()]);
  } catch (err) {
    toast(err.message, 'error');
  }

  const roomSelect = document.getElementById('reqRoom');
  roomSelect.innerHTML = state.rooms.map(r => `<option value="${r.id}">${r.room_number}</option>`).join('');

  drawRequestsTable();

  document.getElementById('requestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const roomId = Number(roomSelect.value);
    const description = document.getElementById('reqDescription').value;
    const tempId = 'temp-' + crypto.randomUUID();
    try {
      await apiMutate('/api/hotel/service-requests/', 'POST', { room: roomId, description, status: 'pending' }, {
        description: `New request for room ${state.rooms.find(r => r.id === roomId)?.room_number}`,
        applyLocally: () => {
          state.serviceRequests.unshift({ id: tempId, room: roomId, description, status: 'pending', requested_at: new Date().toISOString(), _pending: true });
        },
      });
      toast('Service request logged.');
      document.getElementById('requestForm').reset();
      if (!isOffline()) await fetchServiceRequests();
      drawRequestsTable();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

function drawRequestsTable() {
  const body = document.getElementById('requestsTableBody');
  if (!body) return;
  body.innerHTML = state.serviceRequests.length ? state.serviceRequests.map(r => {
    const room = state.rooms.find(rm => rm.id === r.room);
    const isPendingSync = r._pending || typeof r.id === 'string';
    return `
      <tr>
        <td>${room ? room.room_number : r.room}</td>
        <td>${r.description}</td>
        <td>${new Date(r.requested_at).toLocaleString()}</td>
        <td><span class="status-tag status-${r.status === 'completed' ? 'available' : 'cleaning'}">${isPendingSync ? 'pending sync' : r.status}</span></td>
        <td>${r.status === 'pending' && !isPendingSync ? `<button class="btn-ghost btn-small" data-req-id="${r.id}">Mark complete</button>` : ''}</td>
      </tr>
    `;
  }).join('') : '<tr><td colspan="5" class="empty-row">No service requests yet.</td></tr>';

  body.querySelectorAll('button[data-req-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const reqId = Number(btn.dataset.reqId);
      const req = state.serviceRequests.find(r => r.id === reqId);
      try {
        await apiMutate(`/api/hotel/service-requests/${reqId}/`, 'PATCH', { status: 'completed' }, {
          description: `Complete request for room ${req.room}`,
          applyLocally: () => { req.status = 'completed'; },
        });
        toast('Request marked complete.');
        drawRequestsTable();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

// ============================================================
// MANAGER — OVERVIEW / REPORTS
// ============================================================
async function renderOverviewPanel() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="panel-header">
      <div><h2>Overview</h2><p class="sub">Live snapshot of occupancy, revenue, and today's activity.</p></div>
    </div>
    <div class="stat-grid" id="statGrid"><p class="empty-row">Loading reports...</p></div>
  `;
  renderOfflineBanner();

  try {
    await fetchReports();
  } catch (err) {
    toast(err.message, 'error');
    return;
  }

  const { occupancy, revenue, daily, cleaning, maintenance } = state.reports;
  const grid = document.getElementById('statGrid');
  grid.innerHTML = `
    <div class="stat-card"><div class="label">Total rooms</div><div class="value">${occupancy.total_rooms}</div></div>
    <div class="stat-card"><div class="label">Occupied</div><div class="value">${occupancy.occupied_rooms}</div></div>
    <div class="stat-card"><div class="label">Available</div><div class="value">${occupancy.available_rooms}</div></div>
    <div class="stat-card"><div class="label">Cleaning</div><div class="value">${cleaning.cleaning_rooms}</div></div>
    <div class="stat-card"><div class="label">Maintenance</div><div class="value">${maintenance.maintenance_rooms}</div></div>
    <div class="stat-card"><div class="label">Revenue (all-time)</div><div class="value brass">KES ${Number(revenue.total_revenue).toLocaleString()}</div></div>
    <div class="stat-card"><div class="label">Check-ins today</div><div class="value">${daily.check_ins}</div></div>
    <div class="stat-card"><div class="label">Check-outs today</div><div class="value">${daily.check_outs}</div></div>
  `;
}

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(innerHtml) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-backdrop" id="modalBackdrop"><div class="modal">${innerHtml}</div></div>`;
  document.getElementById('modalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modalBackdrop') closeModal();
  });
}
function closeModal() {
  document.getElementById('modalRoot').innerHTML = '';
}

// ============================================================
// INIT
// ============================================================
(function init() {
  if (loadAuth()) {
    enterApp();
  }
  renderOfflineBanner();
})();
