let splitAmounts = [];
let currentIndex = 0;
let globalUpiId = '';
let globalName = '';
let globalNote = '';

// Toggle visibility of the number of parts input depending on selection
function togglePartsInput() {
    const method = document.getElementById('splitMethod').value;
    const partsGroup = document.getElementById('partsGroup');
    partsGroup.style.display = (method === 'equal') ? 'block' : 'none';
}

function generateQRs() {
    globalUpiId = document.getElementById('upiId').value.trim();
    globalName = document.getElementById('name').value.trim();
    const totalAmount = parseFloat(document.getElementById('totalAmount').value);
    const splitMethod = document.getElementById('splitMethod').value;
    globalNote = document.getElementById('note').value.trim();

    if (!globalUpiId || !globalName || isNaN(totalAmount) || totalAmount <= 0) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    splitAmounts = [];
    const maxPerQR = 1999;

    if (splitMethod === 'equal') {
        const numParts = parseInt(document.getElementById('numParts').value);
        if (isNaN(numParts) || numParts <= 0) {
            alert('Please enter a valid number of parts.');
            return;
        }

        const amountPerPart = totalAmount / numParts;

        // Check if equal split exceeds the ₹1,999 limit per QR
        if (amountPerPart > maxPerQR) {
            alert(`Each part amounts to ₹${amountPerPart.toFixed(2)}, which exceeds the ₹1,999 limit per QR! Please increase the number of parts.`);
            return;
        }

        for (let i = 0; i < numParts; i++) {
            splitAmounts.push(amountPerPart);
        }
    } else {
        // Usual / Max Limit Mode (fills up to ₹1,999 per QR until amount is exhausted)
        let remainingAmount = totalAmount;
        while (remainingAmount > 0) {
            let currentAmount = Math.min(remainingAmount, maxPerQR);
            splitAmounts.push(currentAmount);
            remainingAmount -= currentAmount;
        }
    }

    // Reset index to the first QR code and render
    currentIndex = 0;
    renderCurrentQR();
}

// Function to render only the active QR code card at the current index
function renderCurrentQR() {
    const container = document.getElementById('printableArea');
    container.innerHTML = ''; // Clear container

    if (splitAmounts.length === 0) return;

    const amt = splitAmounts[currentIndex];
    const upiString = `upi://pay?pa=${encodeURIComponent(globalUpiId)}&pn=${encodeURIComponent(globalName)}&am=${amt.toFixed(2)}&cu=INR&tn=${encodeURIComponent(globalNote)}`;
    
    // QR Code image generator endpoint URL
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;

    // Style for navigation buttons
    const navBtnStyle = `background-color: #4f46e5; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 13px;`;
    const disabledBtnStyle = `background-color: #d1d5db; color: #9ca3af; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: not-allowed; font-size: 13px;`;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px;">
            <h2 style="font-size: 16px; margin: 0;">Payment Progress</h2>
            <span style="font-size: 13px; font-weight: bold; color: #555;">Part ${currentIndex + 1} of ${splitAmounts.length}</span>
        </div>
        
        <div class="amount-text">₹${amt.toFixed(2)}</div>
        <div>
            <img src="${qrApiUrl}" alt="UPI QR Code" class="qr-image">
        </div>
        <div class="upi-text">${globalUpiId}</div>
        
        <div style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 15px;" class="no-print">
            <button onclick="prevQR()" ${currentIndex === 0 ? `style="${disabledBtnStyle}" disabled` : `style="${navBtnStyle}"`}>
                ⬅️ Prev
            </button>
            <button class="download-btn" onclick="downloadImage('${qrApiUrl}', ${amt.toFixed(2)})" style="margin-top:0; padding: 6px 10px;">Download</button>
            <button onclick="nextQR()" style="${navBtnStyle}">
                ${currentIndex < splitAmounts.length - 1 ? 'Next ➡️' : 'Restart 🔄'}
            </button>
        </div>
    `;
    container.appendChild(card);
}

// Function to advance to the next QR code in sequence
function nextQR() {
    currentIndex++;
    if (currentIndex >= splitAmounts.length) {
        currentIndex = 0; // Loop back to the first QR when finished
    }
    renderCurrentQR();
}

// Function to go back to the previous QR code
function prevQR() {
    if (currentIndex > 0) {
        currentIndex--;
        renderCurrentQR();
    }
}

// Function to handle image downloading natively
function downloadImage(url, amount) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `UPI_QR_${amount}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}