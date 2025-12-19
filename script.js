let extractedNumbers = [];
let isSpinning = false;
let playerCards = {card1: [], card2: [], card3: [], card4: []};
let currentBoardWords = [];
let selectedClass = "mix";
const TOTAL = 35;  //numero di spicchi della ruota




const cssColors = getComputedStyle(document.documentElement)
  .getPropertyValue('--palette-colors')
  .split(',')
  .map(c => c.trim());

console.log(cssColors);


function showPage(page) {
  // cambia pagina
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page).classList.add('active');

  // aggiorna evidenziazione dei pulsanti nav
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


function selectClass(classLevel) {
    selectedClass = classLevel;

    // aggiorna i pallini attivi
    document.querySelectorAll(".class-dot").forEach(btn => {
        btn.classList.remove("active");
    });

    const btn = document.querySelector(
        `.class-dot[data-class="${classLevel}"]`
    );
    if (btn) btn.classList.add("active");

    document.getElementById("navButtons").style.display = "flex";

    createBoard();
    createWheel();
    generatePlayerCards();
    showPage("index");
}


function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}


function applyCategoryClasses(cell, item) {
    const cats = item.categories || [];

    if (cats.includes("OTHER"))   cell.classList.add("cat-other");
    if (cats.includes("NOUN"))    cell.classList.add("cat-noun");
    if (cats.includes("ACTION"))  cell.classList.add("cat-action");
    if (cats.includes("ADJ"))     cell.classList.add("cat-adj");
    if (cats.includes("FAM"))     cell.classList.add("cat-fam");
    if (cats.includes("PERSONALITY")) cell.classList.add("cat-personality");
    if (cats.includes("ANIMAL"))  cell.classList.add("cat-animal");
    if (cats.includes("CLOTHES")) cell.classList.add("cat-clothes");
    if (cats.includes("HOBBY"))     cell.classList.add("cat-hobby");
    if (cats.includes("JOB"))     cell.classList.add("cat-job");
    if (cats.includes("LIT"))     cell.classList.add("cat-lit"); // ultima = prioritaria
}

function createBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";

    let classWords;

    if (selectedClass === "mix") {
        // tutte le parole delle tre classi
        classWords = words.filter(w =>
            w.classe === "1media" ||
            w.classe === "2media" ||
            w.classe === "3media"
        );
    } else {
        // logica già presente
        classWords = words.filter(w => w.classe === selectedClass);

        if (classWords.length < 100) {
            let additionalWords;
            if (selectedClass === "1media") {
                additionalWords = words.filter(w => w.classe === "2media");
            }if (selectedClass === "2media") {
                additionalWords = words.filter(w => w.classe === "1media");
            } else if (selectedClass === "3media") {
                additionalWords = words.filter(
                    w => w.classe === "2media" || w.classe === "1media"
                );
            }
            additionalWords = shuffleArray(additionalWords);
            const needed = 100 - classWords.length;
            classWords = [...classWords, ...additionalWords.slice(0, needed)];
        }
    }

    currentBoardWords = classWords
        .sort((a, b) => a.word.localeCompare(b.word))
        .slice(0, 100);

   currentBoardWords.forEach((item, index) => {
    const num = index + 1;
    const cell = document.createElement("div");
    cell.className = "board-cell  cell";//due classi

    applyCategoryClasses(cell, item);

    cell.innerHTML = `
        <div class="number">${num}</div>
        <div class="word">${item.word}</div>
    `;
    cell.id = `cell-${num}`;
    board.appendChild(cell);
});

}

function randomMixedBoard() {
    selectedClass = "mix";
    
    // aggiorna active
    document.querySelectorAll(".class-dot").forEach(btn => {
        btn.classList.remove("active");
    });
    const mixBtn = document.querySelector(`.class-dot[data-class="mix"]`);
    if (mixBtn) mixBtn.classList.add("active");
    // rimescola tutte le parole delle 3 classi
    const all = words.filter(w =>
        w.classe === "1media" ||
        w.classe === "2media" ||
        w.classe === "3media"
    );
    const shuffled = shuffleArray(all);
    currentBoardWords = shuffled.slice(0, 100);

    const board = document.getElementById("board");
    board.innerHTML = "";
    currentBoardWords.forEach((item, index) => {
        const num = index + 1;
        const cell = document.createElement("div");
        cell.className = "board-cell";
        cell.innerHTML = `
            <div class="number">${num}</div>
            <div class="word">${item.word}</div>
        `;
        cell.id = `cell-${num}`;
        board.appendChild(cell);
    });

    // reset estrazioni
    extractedNumbers = [];
    document.getElementById("wheelBtn").textContent = "Spin!";
    document.getElementById("wheelBtn").disabled = false;
    document.getElementById("extractedNumber").textContent = "";
    document.getElementById("extractedWord").textContent = "";
    document.getElementById("extractedDefinition").textContent = "";
}


function createWheel() {
    const wheel = document.getElementById('wheelBtn');
    const segmentAngle = 360 /TOTAL;

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


// gira la ruota .
function spinWheel() {
    if (isSpinning || extractedNumbers.length === 100) return;
    
    isSpinning = true;
    document.getElementById('wheelBtn').disabled = true;
    
    let availableNumbers = [];
    for (let i = 1; i <= 100; i++) {
        if (!extractedNumbers.includes(i)) {
            availableNumbers.push(i);
        }
    }
    
    const randomNum = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    
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
        
        // Dopo 5 secondi mostra numero e parola, ed evidenzia la casella
        setTimeout(() => {
            document.getElementById('extractedNumber').textContent = randomNum;
            document.getElementById('extractedWord').textContent = wordObj.word;
            
            // Evidenzia la casella sul tabellone
            const cell = document.getElementById(`cell-${randomNum}`);
            if (cell) {
            // prendo il colore del bordo (deriva dalla categoria)
            const styles = getComputedStyle(cell);
            const borderColor = styles.borderColor;

            // applico la classe extracted + sfondo = colore del bordo
            cell.classList.add("extracted");
            cell.style.backgroundColor = borderColor;
            }

            
            isSpinning = false;
            document.getElementById('wheelBtn').disabled = false;
            
            if (extractedNumbers.length === 100) {
                document.getElementById('wheelBtn').textContent = '✅ All Done!';
                document.getElementById('wheelBtn').disabled = true;
            }
        }, 9000); // 9 secondi di ritardo
        
    }, 2000);
}

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

function applyCategoryClasses(cell, item) {
    const cats = item.categories || [];

        if (cats.includes("OTHER"))    cell.classList.add("cat-other");
        if (cats.includes("NOUN"))     cell.classList.add("cat-noun");
        if (cats.includes("ACTION"))   cell.classList.add("cat-action");
        if (cats.includes("ADJ"))      cell.classList.add("cat-adj");
        if (cats.includes("FAM"))    cell.classList.add("cat-fam");
        if (cats.includes("ANIMAL"))   cell.classList.add("cat-animal");
        if (cats.includes("CLOTHES"))  cell.classList.add("cat-clothes");
        if (cats.includes("JOB"))  cell.classList.add("cat-job");
        if (cats.includes("LIT"))      cell.classList.add("cat-lit"); //l'ultima è quella che prevale se una parola ne ha più di uno
}


function renderCard(cardId) {
    const cardEl = document.getElementById(cardId);
    cardEl.innerHTML = "";

    playerCards[cardId].forEach(item => {
        const cell = document.createElement("div");
        cell.className = "card-cell  cell";

        applyCategoryClasses(cell, item);

        cell.textContent = item.word;
        cell.onclick = () => {
            const styles = getComputedStyle(cell);
            const borderColor = styles.borderColor;

            if (!cell.classList.contains("covered")) {
                cell.dataset.originalBg = styles.backgroundColor;
                cell.dataset.originalBorder = borderColor;

                const darker = darkenColor(borderColor, 0.25);
                cell.style.backgroundColor = borderColor;
                cell.style.borderColor = darker;
                cell.style.color = "white";
                cell.classList.add("covered");
            } else {
                cell.style.backgroundColor = cell.dataset.originalBg || "#f0f0f0";
                cell.style.borderColor = cell.dataset.originalBorder || borderColor;
                cell.style.color = "";
                cell.classList.remove("covered");
            }
        };

        cardEl.appendChild(cell);
    });
}

function darkenColor(rgbString, factor) {
    const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgbString;

    let [_, r, g, b] = match;
    r = Math.round(parseInt(r, 10) * (1 - factor));
    g = Math.round(parseInt(g, 10) * (1 - factor));
    b = Math.round(parseInt(b, 10) * (1 - factor));

    return `rgb(${r}, ${g}, ${b})`;
}

function resetCards() {
    document.querySelectorAll('.card-cell').forEach(cell => {
        cell.classList.remove('covered');
        cell.style.backgroundColor = '';
        cell.style.borderColor = '';
        cell.style.color = '';
    });
}

// Inizializza la pagina alla prima apertura
document.addEventListener("DOMContentLoaded", () => {
    // eventuale logica per il pallino mix attivo
    const mixBtn = document.querySelector('.class-dot[data-class="mix"]');
    if (mixBtn) {
        document.querySelectorAll(".class-dot").forEach(btn => {
            btn.classList.remove("active");
        });
        mixBtn.classList.add("active");
    }

    document.getElementById("navButtons").style.display = "flex";

    createBoard();
    createWheel();
    generatePlayerCards();
    showPage("index");
});


function printBoard() {
    // mostra solo la pagina del board
    showPage('index');
    window.print();
}

function printCards() {
    // mostra solo la pagina delle schede
    showPage('player');
    window.print();
}
