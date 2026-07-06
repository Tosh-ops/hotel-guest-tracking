let guests = [];

const guestForm = document.getElementById("guestForm");

function setupEventListeners() {
    // Form submission
    guestForm.addEventListener("submit", function (e) {
        e.preventDefault();
        addGuest();
    });
}

function addGuest() {
    const name = document.getElementById("name").value;
    const roomNumber = document.getElementById("roomNumber").value;
    const phoneNumber = document.getElementById("phoneNumber").value;

    const newGuest = {
        id: Date.now(),
        name,
        roomNumber,
        phoneNumber,
        checkIn: new Date().toLocaleString(),
        checkOut: null
    };

    guests.unshift(newGuest);

    saveGuests();
    renderGuestTable();
    guestForm.reset();
    
}

function checkOutGuest(id) {
    const guest = guests.find(g => g.id === id);

    if (guest) {
        guest.checkOut = new Date().toLocaleDateString();

        saveGuests();
        renderGuestTable();

        showToast("Guest checked out successfully!");
    }
}

function renderGuestTable() {
    const tableBody = document.getElementById("guestTableBody");

    tableBody.innerHTML = "";

    guests.forEach(function (guest) {
        const row = `
            <tr>
                <td>${guest.id}</td>
                <td>${guest.name}</td>
                <td>${guest.roomNumber}</td>
                <td>${guest.phoneNumber}</td>
                <td>${guest.checkIn}</td>
                <td>${guest.checkOut ?? ""}</td>
                <td>
                    <button onclick="checkOutGuest(${guest.id})">Check Out </button>
                    <button onclick="deleteGuest(${guest.id})">Delete</button>
                </td>
            </tr>
        `;

        tableBody.innerHTML += row;
    });
}

function saveGuests() {
    localStorage.setItem("guests", JSON.stringify(guests));
}

function loadGuests() {
    const savedGuests = localStorage.getItem("guests");

    if (savedGuests) {
        guests = JSON.parse(savedGuests);
        renderGuestTable();
    }
}

setupEventListeners();
loadGuests();

function deleteGuest(id) {
    guests = guests.filter(guest => guest.id !== id);

    saveGuests();
    renderGuestTable();

    alert("Guest deleted successfully!");
}

function deleteGuest(id) {

    if (confirm("Are you sure you want to delete this guest?")) {

        guests = guests.filter(guest => guest.id !== id);

        saveGuests();
        renderGuestTable();

        alert("Guest deleted successfully!");
    }
}