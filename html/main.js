const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const highscoreElement = document.getElementById('highscore');
const gameOverElement = document.getElementById('game-over');

// Настройка размера canvas
ctx.canvas.width = COLS * BLOCK_SIZE;
ctx.canvas.height = ROWS * BLOCK_SIZE;
ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let score = 0;
let lines = 0;
let level = 1;
let dropInterval = 1000; // Начальная скорость падения (1 секунда)
let lastTime = 0;
let dropCounter = 0;
let gameOver = false;
let isPlaying = false;

// Настройки по умолчанию
let settings = {
    colorScheme: 'classic',
    background: 'none',
    backgroundColor: '#202028'
};

// Загрузка рекорда
let highscore = localStorage.getItem('tetris-highscore') || 0;
highscoreElement.textContent = highscore;

let COLORS = COLOR_SCHEMES['classic']; // Инициализируем начальные цвета

const piece = {
    pos: {x: 0, y: 0},
    matrix: null,
    color: null
};

function createPiece() {
    const pieces = 'ILJOTSZ';
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    const matrix = JSON.parse(JSON.stringify(SHAPES[type]));
    return {
        matrix,
        color: COLORS[type],
        pos: {x: Math.floor(COLS/2) - Math.floor(matrix[0].length/2), y: 0}
    };
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(board, {x: 0, y: 0});
    drawMatrix(piece.matrix, piece.pos);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardX = x + offset.x;
                const boardY = y + offset.y;
                
                // Определяем цвет для отрисовки
                if (matrix === board) {
                    ctx.fillStyle = value; // value содержит цвет для доски
                } else {
                    ctx.fillStyle = piece.color;
                }
                
                // Рисуем блок
                ctx.fillRect(boardX, boardY, 1, 1);
                
                // Добавляем рамку блока
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 0.1;
                ctx.strokeRect(boardX, boardY, 1, 1);
                
                // Добавляем светлый блик
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(boardX, boardY, 0.3, 0.3);
            }
        });
    });
}

function merge() {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = y + piece.pos.y;
                const boardX = x + piece.pos.x;
                if (boardY >= 0) { // Проверяем, что не выходим за верхнюю границу
                    board[boardY][boardX] = piece.color;
                }
            }
        });
    });
}

function collide() {
    const [m, o] = [piece.matrix, piece.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x]) {
                const boardY = y + o.y;
                const boardX = x + o.x;
                
                if (boardY < 0 || boardY >= ROWS || 
                    boardX < 0 || boardX >= COLS || 
                    board[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function rotate() {
    const matrix = piece.matrix;
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    matrix.forEach(row => row.reverse());
}

function playerDrop() {
    piece.pos.y++;
    if (collide()) {
        piece.pos.y--;
        merge();
        reset();
        clearLines();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    piece.pos.x += dir;
    if (collide()) {
        piece.pos.x -= dir;
    }
}

// Добавим переменную для кнопки паузы
const pauseButton = document.querySelector('.pause-button');

// Изменим функцию play
function play() {
    if (isPlaying) return;
    
    // Сброс игры
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    gameOver = false;
    isPlaying = true;
    isPaused = false;
    
    // Скрываем сообщение о завершении игры
    gameOverElement.style.display = 'none';
    
    scoreElement.textContent = score;
    linesElement.textContent = lines;
    levelElement.textContent = level;
    
    // Активируем кнопку паузы
    pauseButton.disabled = false;
    pauseButton.textContent = 'Пауза';
    
    reset();
    update();
}

// Добавим функцию для переключения паузы
function togglePause() {
    if (!isPlaying || gameOver) return;
    
    if (isPaused) {
        resume();
        pauseButton.textContent = 'Пауза';
    } else {
        pause();
        pauseButton.textContent = 'Продолжить';
    }
}

// Изменим функцию reset для обработки окончания игры
function reset() {
    const p = createPiece();
    piece.matrix = p.matrix;
    piece.pos.y = 0;
    piece.pos.x = Math.floor(COLS/2) - Math.floor(piece.matrix[0].length/2);
    piece.color = p.color;

    if (collide()) {
        gameOver = true;
        if (score > highscore) {
            localStorage.setItem('tetris-highscore', score);
            highscoreElement.textContent = score;
        }
        isPlaying = false;
        // Деактивируем кнопку паузы
        pauseButton.disabled = true;
        pauseButton.textContent = 'Пауза';
        // Показываем сообщение о завершении игры
        gameOverElement.style.display = 'block';
    }
}

function clearLines() {
    let linesCleared = 0;
    
    // Проверяем каждую строку снизу вверх
    for (let y = ROWS - 1; y >= 0; y--) {
        let isLineComplete = true;
        
        // Проверяем все ячейки в строке
        for (let x = 0; x < COLS; x++) {
            if (!board[y][x]) {
                isLineComplete = false;
                break;
            }
        }
        
        if (isLineComplete) {
            // Удаляем заполненную строку
            board.splice(y, 1);
            // Добавляем новую пустую строку сверху
            board.unshift(new Array(COLS).fill(0));
            linesCleared++;
            // Так как мы удалили строку, нужно проверить текущую позицию еще раз
            y++;
        }
    }
    
    if (linesCleared > 0) {
        const points = {
            1: 100,
            2: 400,
            3: 800,
            4: 2000
        };
        
        lines += linesCleared;
        score += points[linesCleared] * level;
        scoreElement.textContent = score;
        linesElement.textContent = lines;
        
        if (lines >= level * 20) {
            level++;
            levelElement.textContent = level;
            dropInterval *= 0.9;
        }
    }
}

// Функция для заполнения списка фонов
function populateBackgrounds() {
    const backgroundSelect = document.getElementById('background');
    backgroundSelect.innerHTML = ''; // Очищаем существующие опции
    
    BACKGROUNDS.forEach(bg => {
        const option = document.createElement('option');
        option.value = bg.value;
        option.textContent = bg.name;
        backgroundSelect.appendChild(option);
    });
}

// Изменим функцию loadSettings
function loadSettings() {
    // Заполняем список фонов
    populateBackgrounds();
    
    const savedSettings = localStorage.getItem('tetris-settings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        applySettings();
    }
}

// Изменим функцию applySettings для немедленного применения цветовой схемы
function applySettings() {
    // Применяем цветовую схему
    COLORS = COLOR_SCHEMES[settings.colorScheme];
    
    // Обновляем цвет текущей фигуры
    if (piece.matrix) {
        const type = Object.keys(COLOR_SCHEMES[settings.colorScheme]).find(
            key => COLOR_SCHEMES[settings.colorScheme][key] === piece.color
        );
        if (type) {
            piece.color = COLORS[type];
        }
    }
    
    // Применяем фон
    document.body.style.backgroundColor = settings.backgroundColor;
    if (settings.background !== 'none') {
        document.body.style.backgroundImage = `url(${settings.background})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
    } else {
        document.body.style.backgroundImage = 'none';
    }
    
    // Обновляем значения в форме настроек
    document.getElementById('color-scheme').value = settings.colorScheme;
    document.getElementById('background').value = settings.background;
    document.getElementById('background-color').value = settings.backgroundColor;

    // Перерисовываем игровое поле с новыми цветами
    if (isPlaying) {
        draw();
    }
}

function openSettings() {
    document.getElementById('settings-modal').style.display = 'block';
    if (isPlaying && !isPaused) {
        pause();
        pauseButton.textContent = 'Продолжить';
    }
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
    if (isPlaying && isPaused) {
        resume();
        pauseButton.textContent = 'Пауза';
    }
}

function saveSettings() {
    const newSettings = {
        colorScheme: document.getElementById('color-scheme').value,
        background: document.getElementById('background').value,
        backgroundColor: document.getElementById('background-color').value
    };
    
    // Сохраняем настройки
    settings = newSettings;
    localStorage.setItem('tetris-settings', JSON.stringify(settings));
    
    // Применяем новые настройки
    applySettings();
    closeSettings();
}

// Добавляем паузу
let isPaused = false;

function pause() {
    if (!isPaused) {
        isPaused = true;
        pauseButton.textContent = 'Продолжить';
    }
}

function resume() {
    if (isPaused) {
        isPaused = false;
        lastTime = 0;
        requestAnimationFrame(update);
        pauseButton.textContent = 'Пауза';
    }
}

// Модифицируем функцию update
function update(time = 0) {
    if (!isPlaying || isPaused) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    
    if (!gameOver) {
        requestAnimationFrame(update);
    }
}

document.addEventListener('keydown', event => {
    if (event.keyCode === 27) { // Escape
        closeSettings();
        return;
    }

    if (!isPlaying) return;

    switch(event.keyCode) {
        case 37: // Left
            playerMove(-1);
            break;
        case 39: // Right
            playerMove(1);
            break;
        case 40: // Down
            playerDrop();
            break;
        case 38: // Up
            rotate();
            if (collide()) {
                rotate();
                rotate();
                rotate();
            }
            break;
    }
});

// Загружаем настройки при старте
loadSettings(); 