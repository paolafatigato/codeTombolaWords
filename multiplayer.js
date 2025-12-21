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
            selectedCategories: selectedCategories,
            selectedClassLevels: selectedClassLevels,
            boardWords: currentBoardWords,
            createdAt: Date.now()
        };
        
        // Salva su Firebase
        await firebase.database().ref('boards/' + code).set(boardData);
        
        // ⭐ PRIMA imposta il codice corrente
        currentSessionCode = code;
        showSessionCode(code);
        
        // ⭐ POI aggiorna le carte E il tabellone con il nuovo codice
        addCodeToCards();
        addCodeToBoard();
        
        console.log('✅ Tabellone salvato su Firebase:', code);
        console.log('🎴 Codice aggiunto alle carte:', code);
        
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
        selectedClass = boardData.classLevel || 'mix';
        selectedCategories = boardData.selectedCategories || [];
        selectedClassLevels = boardData.selectedClassLevels || ['all'];
        currentBoardWords = boardData.boardWords;
        extractedNumbers = [];
        
        // ⭐ PRIMA imposta il codice corrente
        currentSessionCode = code;
        showSessionCode(code);
        
        // Aggiorna UI
        updateClassButtons();
        renderBoard();
        createWheel();
        
        // Rigenera le carte associate al nuovo tabellone
        generatePlayerCards();
        
        // ⭐ POI aggiorna le carte E il tabellone con il codice caricato
        addCodeToCards();
        addCodeToBoard();
        
        showPage("index");
        
        // Reset wheel
        document.getElementById("wheelBtn").disabled = false;
        document.getElementById("extractedNumber").textContent = "";
        document.getElementById("extractedWord").textContent = "";
        document.getElementById("extractedDefinition").textContent = "";
        
        hideLoadingMessage();
        
        console.log('✅ Tabellone caricato:', code);
        console.log('📋 Carte rigenerate per il nuovo tabellone');
        
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
        btn.textContent = '⏳';
        btn.disabled = true;
    }
}

function hideLoadingMessage() {
    const btn = document.querySelector('.load-code-btn');
    if (btn) {
        btn.textContent = '📥';
        btn.disabled = false;
    }
}

// Mostra il codice nell'header
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
    
    // ⭐ Aggiungi il codice sotto al tabellone
    addCodeToBoard();
}

// Aggiungi il codice sotto al tabellone
function addCodeToBoard() {
    const boardContainer = document.querySelector('.board-container');
    if (!boardContainer) return;
    
    // Rimuovi eventuale codice precedente
    const existingCode = boardContainer.querySelector('.board-code-display');
    if (existingCode) {
        existingCode.remove();
    }
    
    // Aggiungi nuovo codice se esiste
    if (currentSessionCode) {
        const codeDiv = document.createElement('div');
        codeDiv.className = 'board-code-display';
        codeDiv.setAttribute('data-code', currentSessionCode);
        boardContainer.appendChild(codeDiv);
    }
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
    generatePlayerCards(); // ⭐ Rigenera carte
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
    currentBoardWords = shuffled.slice(0, 90);
    
    renderBoard();
    
    extractedNumbers = [];
    document.getElementById("wheelBtn").disabled = false;
    document.getElementById("extractedNumber").textContent = "";
    document.getElementById("extractedWord").textContent = "";
    document.getElementById("extractedDefinition").textContent = "";
    
    createWheel();
    generatePlayerCards(); // ⭐ Rigenera carte
    
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
