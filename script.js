// ============================================
// VARIABILI GLOBALI
// ============================================
let extractedNumbers = [];
let isSpinning = false;
let playerCards = {card1: [], card2: [], card3: [], card4: []};
let currentBoardWords = [];
let selectedClass = "mix";
let selectedCategories = [];
let selectedClassLevels = ['all']; // Default: tutte le classi
const TOTAL = 34;  // numero di spicchi della ruota

// Estrae i colori CSS dalla variabile custom
const cssColors = getComputedStyle(document.documentElement)
  .getPropertyValue('--palette-colors')
  .split(',')
  .map(c => c.trim());

console.log(cssColors);

// ============================================
// CONFIGURAZIONE CATEGORIE
// ============================================
const availableCategories = [
    { id: 'LIT', label: 'Literature', emoji: '📜' },
    { id: 'NOUN', label: 'Nouns', emoji: '📦' },
    { id: 'ADJ', label: 'Adjectives', emoji: '✨' },
    { id: 'ACTION', label: 'Verbs', emoji: '🏃' },
    { id: 'SCHOOL', label: 'School', emoji: '🏫' },
    { id: 'HOBBY', label: 'Hobbies', emoji: '🎨' },
    { id: 'ANIMAL', label: 'Animals', emoji: '🦁' },
    { id: 'PERSONALITY', label: 'Personality', emoji: '😊' },
    { id: 'JOB', label: 'Jobs', emoji: '👩‍💼' },
    { id: 'CLOTHES', label: 'Clothes', emoji: '👕' },
    { id: 'FAM', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
    { id: 'OTHER', label: 'Other', emoji: '📖' }
];

// Categorie principali (esclude OTHER)
const mainCategories = availableCategories
    .filter(cat => cat.id !== 'OTHER')
    .map(cat => cat.id);

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Rimescola un array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Applica le classi CSS in base alle categorie della parola
function applyCategoryClasses(cell, item) {
    const cats = item.categories || [];

    if (cats.includes("OTHER"))       cell.classList.add("cat-other");
    if (cats.includes("NOUN"))        cell.classList.add("cat-noun");
    if (cats.includes("ACTION"))      cell.classList.add("cat-action");
    if (cats.includes("ADJ"))         cell.classList.add("cat-adj");
    if (cats.includes("FAM"))         cell.classList.add("cat-fam");
    if (cats.includes("PERSONALITY")) cell.classList.add("cat-personality");
    if (cats.includes("ANIMAL"))      cell.classList.add("cat-animal");
    if (cats.includes("CLOTHES"))     cell.classList.add("cat-clothes");
    if (cats.includes("HOBBY"))       cell.classList.add("cat-hobby");
    if (cats.includes("JOB"))         cell.classList.add("cat-job");
    if (cats.includes("LIT"))         cell.classList.add("cat-lit"); // ultima = prioritaria
}

// Scurisce un colore RGB di una certa percentuale
function darkenColor(rgbString, factor) {
    const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgbString;

    let [_, r, g, b] = match;
    r = Math.round(parseInt(r, 10) * (1 - factor));
    g = Math.round(parseInt(g, 10) * (1 - factor));
    b = Math.round(parseInt(b, 10) * (1 - factor));

    return `rgb(${r}, ${g}, ${b})`;
}

// ============================================
// NAVIGATION & PAGE MANAGEMENT
// ============================================

// Cambia pagina e aggiorna la navigazione
function showPage(page) {
    // Cambia pagina
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');

    // Aggiorna evidenziazione dei pulsanti nav
    const navIndex = document.getElementById('nav-index');
    const navPlayer = document.getElementById('nav-player');

    if (navIndex && navPlayer) {
        navIndex.classList.remove('active');
        navPlayer.classList.remove('active');

        if (page === 'index') {
            navIndex.classList.add('active');
        } else if (page === 'player') {
            navPlayer.classList.add('active');
        }
    }
}

// ============================================
// BOARD CREATION
// ============================================

// Crea il tabellone base (usato all'inizializzazione)
function createBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";

    let classWords;

    if (selectedClass === "mix") {
        // Tutte le parole delle tre classi
        classWords = words.filter(w =>
            w.classe === "1media" ||
            w.classe === "2media" ||
            w.classe === "3media"
        );
    } else {
        // Parole della classe selezionata
        classWords = words.filter(w => w.classe === selectedClass);

        // Se non ci sono abbastanza parole, aggiungi da altre classi
        if (classWords.length < 90) {
            let additionalWords;
            if (selectedClass === "1media") {
                additionalWords = words.filter(w => w.classe === "2media");
            } else if (selectedClass === "2media") {
                additionalWords = words.filter(w => w.classe === "1media");
            } else if (selectedClass === "3media") {
                additionalWords = words.filter(
                    w => w.classe === "2media" || w.classe === "1media"
                );
            }
            additionalWords = shuffleArray(additionalWords);
            const needed = 90 - classWords.length;
            classWords = [...classWords, ...additionalWords.slice(0, needed)];
        }
    }

    // Ordina alfabeticamente e prendi le prime 90
    currentBoardWords = classWords
        .sort((a, b) => a.word.localeCompare(b.word))
        .slice(0, 90);

    // Disegna le celle
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

// Crea il tabellone applicando filtri per classi e categorie
function createCategoryBoard(categories = [], classLevels = ['all']) {
    const board = document.getElementById('board');
    board.innerHTML = '';

    // 1) FILTRO PER CLASSI CON PRIORITÀ ASSOLUTA
    let priorityClassWords = [];
    let otherClassWords = [];

    if (classLevels.includes('all') || classLevels.length === 0) {
        // Tutte le classi senza priorità
        priorityClassWords = words.filter(
            w =>
                w.classe === '1media' ||
                w.classe === '2media' ||
                w.classe === '3media'
        );
    } else {
        // Separa parole della classe selezionata dalle altre
        words.forEach(word => {
            if (classLevels.includes(word.classe)) {
                priorityClassWords.push(word);
            } else if (
                word.classe === '1media' ||
                word.classe === '2media' ||
                word.classe === '3media'
            ) {
                otherClassWords.push(word);
            }
        });
    }

    // 2) FILTRO PER CATEGORIE CON PRIORITÀ ASSOLUTA
    let priorityCategoryWords = [];
    let otherCategoryWords = [];

    if (categories.length > 0) {
        // Applica filtro categorie al pool prioritario delle classi
        priorityClassWords.forEach(word => {
            let hasSelectedCategory = false;

            // Controlla se ha la categoria OTHER (nessuna categoria principale)
            if (categories.includes('OTHER')) {
                const hasMainCategory = (word.categories || []).some(cat =>
                    mainCategories.includes(cat)
                );
                if (!hasMainCategory) {
                    hasSelectedCategory = true;
                }
            }

            // Controlla altre categorie selezionate
            const otherSelected = categories.filter(cat => cat !== 'OTHER');
            if (otherSelected.length > 0) {
                const hasOtherCategory = (word.categories || []).some(cat =>
                    otherSelected.includes(cat)
                );
                if (hasOtherCategory) {
                    hasSelectedCategory = true;
                }
            }

            if (hasSelectedCategory) {
                priorityCategoryWords.push(word);
            } else {
                otherCategoryWords.push(word);
            }
        });
    } else {
        // Nessuna categoria selezionata = tutte le parole della classe prioritaria
        priorityCategoryWords = priorityClassWords;
    }

    // 3) COSTRUZIONE POOL FINALE CON PRIORITÀ ASSOLUTA
    let finalPool = [];

    // Shuffle delle parole prioritarie (classe + categoria corrette)
    const shuffledPriority = shuffleArray(priorityCategoryWords);
    finalPool = shuffledPriority.slice(0, 90);

    // Se non bastano, aggiungi dalle parole della classe corretta ma categoria diversa
    if (finalPool.length < 90 && categories.length > 0) {
        const needed = 90 - finalPool.length;
        const shuffledOtherCategory = shuffleArray(otherCategoryWords);
        finalPool.push(...shuffledOtherCategory.slice(0, needed));
    }

    // Se ancora non bastano, aggiungi dalle altre classi
    if (finalPool.length < 90 && !classLevels.includes('all')) {
        const needed = 90 - finalPool.length;
        
        if (categories.length > 0) {
            // Filtra le altre classi per categoria
            let otherClassFiltered = [];
            let otherClassRest = [];
            
            otherClassWords.forEach(word => {
                let hasSelectedCategory = false;

                if (categories.includes('OTHER')) {
                    const hasMainCategory = (word.categories || []).some(cat =>
                        mainCategories.includes(cat)
                    );
                    if (!hasMainCategory) {
                        hasSelectedCategory = true;
                    }
                }

                const otherSelected = categories.filter(cat => cat !== 'OTHER');
                if (otherSelected.length > 0) {
                    const hasOtherCategory = (word.categories || []).some(cat =>
                        otherSelected.includes(cat)
                    );
                    if (hasOtherCategory) {
                        hasSelectedCategory = true;
                    }
                }

                if (hasSelectedCategory) {
                    otherClassFiltered.push(word);
                } else {
                    otherClassRest.push(word);
                }
            });

            // Prima prova con le parole delle altre classi ma con categoria corretta
            const shuffledOtherClassFiltered = shuffleArray(otherClassFiltered);
            const toAdd = Math.min(needed, shuffledOtherClassFiltered.length);
            finalPool.push(...shuffledOtherClassFiltered.slice(0, toAdd));

            // Se ancora non basta, usa qualsiasi parola
            if (finalPool.length < 90) {
                const stillNeeded = 90 - finalPool.length;
                const shuffledRest = shuffleArray(otherClassRest);
                finalPool.push(...shuffledRest.slice(0, stillNeeded));
            }
        } else {
            // Nessuna categoria: usa semplicemente altre classi
            const shuffledOtherClass = shuffleArray(otherClassWords);
            finalPool.push(...shuffledOtherClass.slice(0, needed));
        }
    }

    currentBoardWords = finalPool;

    // Ordina alfabeticamente
    currentBoardWords = currentBoardWords.sort((a, b) =>
        a.word.localeCompare(b.word)
    );

    // 4) DISEGNA IL TABELLONE
    currentBoardWords.forEach((item, index) => {
        const num = index + 1;
        const cell = document.createElement('div');
        cell.className = 'board-cell cell';
        applyCategoryClasses(cell, item);
        cell.innerHTML = `
            <div class="number">${num}</div>
            <div class="word">${item.word}</div>
        `;
        cell.id = `cell-${num}`;
        board.appendChild(cell);
    });

    // Reset ruota/estrazioni
    extractedNumbers = [];
    document.getElementById('wheelBtn').disabled = false;
    document.getElementById('extractedNumber').textContent = '';
    document.getElementById('extractedWord').textContent = '';
    document.getElementById('extractedDefinition').textContent = '';

    createWheel();
    generatePlayerCards();
    
    // Salva il tabellone se la funzione esiste
    if (typeof saveBoardToStorage === 'function') {
        setTimeout(saveBoardToStorage, 100);
    }
}

// ============================================
// WHEEL CREATION & SPIN
// ============================================

// Crea la ruota con i colori
function createWheel() {
    const wheel = document.getElementById('wheelBtn');
    const segmentAngle = 360 / TOTAL;

    let gradientStops = [];

    for (let i = 0; i < TOTAL; i++) {
        const colorIndex = i % cssColors.length;
        const startAngle = i * segmentAngle;
        const endAngle = (i + 1) * segmentAngle;

        gradientStops.push(
            `${cssColors[colorIndex]} ${startAngle}deg ${endAngle}deg`
        );
    }

    wheel.style.background = `conic-gradient(${gradientStops.join(', ')})`;
}

// Gira la ruota ed estrae un numero
function spinWheel() {
    if (isSpinning || extractedNumbers.length === 90) return;
    
    isSpinning = true;
    document.getElementById('wheelBtn').disabled = true;
    
    // Trova numeri disponibili
    let availableNumbers = [];
    for (let i = 1; i <= 90; i++) {
        if (!extractedNumbers.includes(i)) {
            availableNumbers.push(i);
        }
    }
    
    const randomNum = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    
    // Animazione rotazione
    const wheel = document.getElementById('wheelBtn');
    const spins = 5 + Math.random() * 3;
    const rotation = spins * 360 + Math.random() * 360;
    wheel.style.transform = `rotate(${rotation}deg)`;
    
    setTimeout(() => {
        extractedNumbers.push(randomNum);
        const wordObj = currentBoardWords[randomNum - 1];
        
        // Mostra SOLO la definizione
        document.getElementById('extractedNumber').textContent = '';
        document.getElementById('extractedWord').textContent = '';
        document.getElementById('extractedDefinition').textContent = wordObj.definition;
        
        // Dopo 8 secondi mostra numero e parola, ed evidenzia la casella
        setTimeout(() => {
            document.getElementById('extractedNumber').textContent = randomNum;
            document.getElementById('extractedWord').textContent = wordObj.word;
            
            // Evidenzia la casella sul tabellone
            const cell = document.getElementById(`cell-${randomNum}`);
            if (cell) {
                // Prendo il colore del bordo (deriva dalla categoria)
                const styles = getComputedStyle(cell);
                const borderColor = styles.borderColor;

                // Applico la classe extracted + sfondo = colore del bordo
                cell.classList.add("extracted");
                cell.style.backgroundColor = borderColor;
            }
            
            isSpinning = false;
            document.getElementById('wheelBtn').disabled = false;
            
            if (extractedNumbers.length === 90) {
                document.getElementById('wheelBtn').textContent = '✅ All Done!';
                document.getElementById('wheelBtn').disabled = true;
            }
        }, 8000); // 8 secondi di ritardo
        
    }, 500); // Dopo mezzo secondo mostra la definizione
}

// ============================================
// PLAYER CARDS
// ============================================

// Genera le 4 schede giocatore con parole casuali
function generatePlayerCards() {
    const cardSizes = [14, 15, 15, 14];
    
    ['card1', 'card2', 'card3', 'card4'].forEach((cardId, idx) => {
        const size = cardSizes[idx];
        let availableWords = [...currentBoardWords];
        let selectedWords = [];
        
        for (let i = 0; i < size; i++) {
            const randomIdx = Math.floor(Math.random() * availableWords.length);
            selectedWords.push(availableWords[randomIdx]);
            availableWords.splice(randomIdx, 1);
        }
        
        playerCards[cardId] = selectedWords;
        renderCard(cardId);
    });
}

// Renderizza una singola scheda giocatore
function renderCard(cardId) {
    const cardEl = document.getElementById(cardId);
    cardEl.innerHTML = "";

    playerCards[cardId].forEach(item => {
        const cell = document.createElement("div");
        cell.className = "card-cell cell";

        applyCategoryClasses(cell, item);

        cell.textContent = item.word;
        cell.onclick = () => {
            const styles = getComputedStyle(cell);
            const borderColor = styles.borderColor;

            if (!cell.classList.contains("covered")) {
                // Copri la cella
                cell.dataset.originalBg = styles.backgroundColor;
                cell.dataset.originalBorder = borderColor;

                const darker = darkenColor(borderColor, 0.25);
                cell.style.backgroundColor = borderColor;
                cell.style.borderColor = darker;
                cell.style.color = "white";
                cell.classList.add("covered");
            } else {
                // Scopri la cella
                cell.style.backgroundColor = cell.dataset.originalBg || "#f0f0f0";
                cell.style.borderColor = cell.dataset.originalBorder || borderColor;
                cell.style.color = "";
                cell.classList.remove("covered");
            }
        };

        cardEl.appendChild(cell);
    });
    addCodeToCards(); 
}

function addCodeToCards() {
    if (currentSessionCode) {
        document.querySelectorAll('.card').forEach(card => {
            card.setAttribute('data-code', currentSessionCode);
        });
    }
}

// Reset tutte le celle coperte
function resetCards() {
    document.querySelectorAll('.card-cell').forEach(cell => {
        cell.classList.remove('covered');
        cell.style.backgroundColor = '';
        cell.style.borderColor = '';
        cell.style.color = '';
    });
}

// ============================================
// CATEGORY FILTER SYSTEM
// ============================================

// Toggle filtro per classe (All, 1media, 2media, 3media)
function toggleClassFilter(classLevel) {
    const allBtn = document.querySelector('.class-filter-btn[data-class="all"]');
    const specificBtns = document.querySelectorAll('.class-filter-btn[data-class]:not([data-class="all"])');
    
    if (classLevel === 'all') {
        // Se clicca "All", deseleziona tutte le classi specifiche
        selectedClassLevels = ['all'];
        allBtn.classList.add('selected');
        specificBtns.forEach(btn => btn.classList.remove('selected'));
    } else {
        // Rimuove "all" se presente
        selectedClassLevels = selectedClassLevels.filter(c => c !== 'all');
        allBtn.classList.remove('selected');
        
        // Toggle della classe specifica
        if (selectedClassLevels.includes(classLevel)) {
            selectedClassLevels = selectedClassLevels.filter(c => c !== classLevel);
        } else {
            selectedClassLevels.push(classLevel);
        }
        
        // Se non c'è nessuna selezione, torna ad "all"
        if (selectedClassLevels.length === 0) {
            selectedClassLevels = ['all'];
            allBtn.classList.add('selected');
        } else {
            // Aggiorna i bottoni
            specificBtns.forEach(btn => {
                const btnClass = btn.getAttribute('data-class');
                if (selectedClassLevels.includes(btnClass)) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        }
    }
}

// Renderizza la griglia delle categorie
function renderCategoryGrid() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    availableCategories.forEach(cat => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.onclick = () => toggleCategory(cat.id);
        
        if (selectedCategories.includes(cat.id)) {
            button.classList.add('selected');
        }
        
        button.innerHTML = `
            <div class="category-emoji">${cat.emoji}</div>
            <div class="category-label">${cat.label}</div>
            <div class="category-id">${cat.id}</div>
        `;
        
        grid.appendChild(button);
    });
    
    updateSelectedDisplay();
}

// Toggle selezione categoria
function toggleCategory(categoryId) {
    if (selectedCategories.includes(categoryId)) {
        selectedCategories = selectedCategories.filter(id => id !== categoryId);
    } else {
        selectedCategories.push(categoryId);
    }
    renderCategoryGrid();
}

// Pulisce tutte le categorie selezionate
function clearCategories() {
    selectedCategories = [];
    renderCategoryGrid();
}

// Pulisce tutti i filtri (categorie + classi)
function clearAllFilters() {
    selectedCategories = [];
    selectedClassLevels = ['all'];
    
    // Reset UI
    document.querySelectorAll('.class-filter-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    const allBtn = document.querySelector('.class-filter-btn[data-class="all"]');
    if (allBtn) allBtn.classList.add('selected');
    
    renderCategoryGrid();
}

// Aggiorna il testo con le categorie selezionate
function updateSelectedDisplay() {
    const display = document.getElementById('selectedCategoriesText');
    if (!display) return;
    
    if (selectedCategories.length === 0) {
        display.textContent = 'None (all categories will be used)';
        display.style.color = '#999';
    } else {
        const labels = selectedCategories.map(id => {
            const cat = availableCategories.find(c => c.id === id);
            return cat ? `${cat.emoji} ${cat.label}` : id;
        }).join(', ');
        display.textContent = labels;
        display.style.color = '#F33409';
    }
}

// Applica i filtri selezionati e torna alla pagina principale
function applyCategories() {
    createCategoryBoard(selectedCategories, selectedClassLevels);
    showPage('index');
}

// ============================================
// PRINT FUNCTIONS
// ============================================

// Stampa il tabellone
function printBoard() {
    showPage('index');
    window.print();
}

// Stampa le schede giocatore
function printCards() {
    showPage('player');
    window.print();
}

// ============================================
// INITIALIZATION
// ============================================

// Inizializza la pagina alla prima apertura
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("navButtons").style.display = "flex";

    // Crea il tabellone iniziale
    createBoard();
    createWheel();
    generatePlayerCards();
    showPage("index");

    // Inizializza la griglia delle categorie dopo un breve delay
    setTimeout(() => {
        if (document.getElementById('categoryGrid')) {
            renderCategoryGrid();
            
            // Imposta "All" come selezionato di default per le classi
            const allBtn = document.querySelector('.class-filter-btn[data-class="all"]');
            if (allBtn) allBtn.classList.add('selected');
        }
    }, 200);
});
