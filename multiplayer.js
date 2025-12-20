// multiplayer.js - Sistema codice con Firebase

let currentSessionCode = null;

// Genera codice sessione casuale (6 caratteri)
function generateSessionCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Salva il tabellone su Firebase
async function saveBoardToStorage() {
    try {
        const code = generateSessionCode();
        
        const boardData = {
            code: code,
            classLevel: selectedClass,
            boardWords: currentBoardWords,
            createdAt: Date.now()
        };
        
        // Salva su Firebase
        await firebase.database().ref('boards/' + code).set(boardData);
        
        currentSessionCode = code;
        showSessionCode(code);
        
        console.log('✅ Tabellone salvato su Firebase:', code);
        
    } catch (err) {
        console.error('❌ Errore Firebase:', err);
        alert('Errore nel salvataggio. Controlla la connessione internet.');
    }
}

// Carica un tabellone da Firebase
async function loadBoardFromCode(code) {
    try {
        // Mostra loading
        showLoadingMessage();
        
        const snapshot = await firebase.database().ref('boards/' + code).once('value');
        
        if (!snapshot.exists()) {
            hideLoadingMessage();
            alert('❌ Codice non trovato! Verifica di averlo scritto correttamente.');
            return false;
        }
        
        const boardData = snapshot.val();
        
        // Imposta i dati globali
        selectedClass = boardData.classLevel;
        currentBoardWords = boardData.boardWords;
        extractedNumbers = [];
        
        // Aggiorna UI
        updateClassButtons();
        renderBoard();
        createWheel();
        generatePlayerCards();
        showPage("index");
        
        // Reset wheel
        document.getElementById("wheelBtn").disabled = false;
        document.getElementById("extractedNumber").textContent = "";
        document.getElementById("extractedWord").textContent = "";
        document.getElementById("extractedDefinition").textContent = "";
        
        currentSessionCode = code;
        showSessionCode(code);
        hideLoadingMessage();
        
        console.log('✅ Tabellone caricato:', code);
        
        return true;
        
    } catch (err) {
        hideLoadingMessage();
        alert('❌ Errore nel caricamento: ' + err.message);
        return false;
    }
}

// Mostra messaggio di caricamento
function showLoadingMessage() {
    const input = document.getElementById('codeInput');
    const btn = document.querySelector('.load-code-btn');
    if (btn) {
        btn.textContent = '⏳ Carico...';
        btn.disabled = true;
    }
}

function hideLoadingMessage() {
    const btn = document.querySelector('.load-code-btn');
    if (btn) {
        btn.textContent = '📥 Carica';
        btn.disabled = false;
    }
}

// Mostra il codice nell'header (non più sotto il tabellone)
function showSessionCode(code) {
    const codeDisplay = document.getElementById('currentCodeDisplay');
    if (codeDisplay) {
        codeDisplay.textContent = code;
        codeDisplay.classList.add('active');
    }
}

// Aggiorna i pulsanti delle classi
function updateClassButtons() {
    document.querySelectorAll(".class-dot").forEach(btn => {
        btn.classList.remove("active");
    });
    
    const btn = document.querySelector(`.class-dot[data-class="${selectedClass}"]`);
    if (btn) btn.classList.add("active");
}

// Renderizza il tabellone
function renderBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";
    
    currentBoardWords.forEach((item, index) => {
        const num = index + 1;
        const cell = document.createElement("div");
        cell.className = "board-cell cell";
        
        applyCategoryClasses(cell, item);
        
        cell.innerHTML = `
            <div class="number">${num}</div>
            <div class="word">${item.word}</div>
        `;
        cell.id = `cell-${num}`;
        board.appendChild(cell);
    });
}

// Gestisci click sul pulsante "Carica"
function handleLoadFromCode() {
    const input = document.getElementById('codeInput');
    const code = input.value.toUpperCase().trim();
    
    if (!code) {
        alert('⚠️ Inserisci un codice!');
        return;
    }
    
    if (code.length !== 6) {
        alert('⚠️ Il codice deve essere di 6 caratteri!');
        return;
    }
    
    loadBoardFromCode(code);
    input.value = '';
}

// Permetti invio con Enter nel campo codice
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('codeInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLoadFromCode();
            }
        });
    }
});

// Override selectClass
window.selectClass = function(classLevel) {
    selectedClass = classLevel;
    updateClassButtons();
    document.getElementById("navButtons").style.display = "flex";
    
    createBoard();
    createWheel();
    generatePlayerCards();
    showPage("index");
    
    setTimeout(() => {
        saveBoardToStorage();
    }, 100);
};

// Override randomMixedBoard
window.randomMixedBoard = function() {
    selectedClass = "mix";
    updateClassButtons();
    
    const all = words.filter(w =>
        w.classe === "1media" ||
        w.classe === "2media" ||
        w.classe === "3media"
    );
    const shuffled = shuffleArray(all);
    currentBoardWords = shuffled.slice(0, 100);
    
    renderBoard();
    
    extractedNumbers = [];
    document.getElementById("wheelBtn").disabled = false;
    document.getElementById("extractedNumber").textContent = "";
    document.getElementById("extractedWord").textContent = "";
    document.getElementById("extractedDefinition").textContent = "";
    
    createWheel();
    generatePlayerCards();
    
    setTimeout(() => {
        saveBoardToStorage();
    }, 100);
};

// Genera codice al primo caricamento
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (currentBoardWords && currentBoardWords.length > 0) {
            saveBoardToStorage();
        }
    }, 500);
});
