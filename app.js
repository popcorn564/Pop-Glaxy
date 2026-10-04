// 10 Slot Definitions (All denominated in GRAM)
const slotTiers = [
    { id: 1, gramPrice: 2 },
    { id: 2, gramPrice: 4 },
    { id: 3, gramPrice: 8 },
    { id: 4, gramPrice: 16 },
    { id: 5, gramPrice: 32 },
    { id: 6, gramPrice: 64 },
    { id: 7, gramPrice: 128 },
    { id: 8, gramPrice: 250 },
    { id: 9, gramPrice: 500 },
    { id: 10, gramPrice: 1000 }
];

let selectedCurrency = "POP";
let currentDevFee = 0.8; // Default 0.8 GRAM for POP
let currentSelectedSlot = null;

// Initialize Slots
function renderSlots() {
    const container = document.getElementById("slots-container");
    container.innerHTML = "";

    slotTiers.forEach(slot => {
        const card = document.createElement("div");
        card.className = "slot-card";
        card.innerHTML = `
            <div class="slot-tier">SLOT #${slot.id}</div>
            <div class="slot-cost">${slot.gramPrice} GRAM</div>
            <div class="matrix-nodes">
                <div class="node filled"></div>
                <div class="node"></div>
                <div class="node"></div>
            </div>
            <div class="recycle-text">Cycles: 0 | 1/3</div>
            <button class="buy-slot-btn" onclick="openPurchaseModal(${slot.id}, ${slot.gramPrice})">অ্যাক্টিভেট</button>
        `;
        container.appendChild(card);
    });
}

// Handle Currency Toggles
document.querySelectorAll(".curr-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll(".curr-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");

        selectedCurrency = e.target.getAttribute("data-currency");
        
        // Fee logic: POP = 0.8 GRAM, GRAM/USDT = 1.0 GRAM
        if (selectedCurrency === "POP") {
            currentDevFee = 0.8;
        } else {
            currentDevFee = 1.0;
        }

        document.getElementById("fee-display").innerText = `সার্ভিস ফি: ${currentDevFee.toFixed(1)} GRAM (Dev Wallet)`;
    });
});

// Modal Operations
function openPurchaseModal(slotId, gramPrice) {
    currentSelectedSlot = { id: slotId, price: gramPrice };
    document.getElementById("modal-slot-id").innerText = `#${slotId}`;
    document.getElementById("modal-slot-price").innerText = `${gramPrice} GRAM`;
    document.getElementById("modal-currency").innerText = selectedCurrency;
    document.getElementById("modal-dev-fee").innerText = `${currentDevFee} GRAM`;
    document.getElementById("modal-total-amount").innerText = `${(gramPrice + currentDevFee).toFixed(1)} GRAM`;

    document.getElementById("purchase-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("purchase-modal").style.display = "none";
}

function confirmPurchase() {
    alert(`স্লট #${currentSelectedSlot.id} কেনার রিকোয়েস্ট সফল! ফি হিসেবে ${currentDevFee} GRAM আপনার কনফিগার করা ডেভেলপমেন্ট ওয়ালেটে পাঠানো হয়েছে।`);
    closeModal();
}

renderSlots();
