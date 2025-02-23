class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextPieceCanvas = document.getElementById('nextPieceCanvas');
        this.nextPieceCtx = this.nextPieceCanvas.getContext('2d');
        this.settings = new GameSettings();
        this.gameOverElement = document.querySelector('.game-over');
        this.gameContainer = document.querySelector('.game-container');
        this.loadBackgroundImage();

        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameSpeed = 1000;
        this.gameOver = false;
        this.isPaused = false;

        this.board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.keyStates = new Set();
        this.lastMoveTime = 0;
        this.moveDelay = 50;
        this.lastAutoDropTime = 0;

        this.setupControls();
        this.setupButtons();

        // Слушаем изменения настроек
        document.getElementById('bgTheme').addEventListener('change', () => {
            this.loadBackgroundImage();
        });
    }

    loadBackgroundImage() {
        const bgTheme = this.settings.bgTheme;
        const background = BACKGROUNDS.find(bg => bg.id === bgTheme);
        if (background) {
            this.gameContainer.style.backgroundImage = `url(${background.path})`;
        }
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;
            this.keyStates.add(e.key);
        });

        document.addEventListener('keyup', (e) => {
            this.keyStates.delete(e.key);
        });

        // Обработка нажатых клавиш в отдельном цикле
        setInterval(() => {
            if (this.gameOver || this.isPaused) return;
            const now = Date.now();

            if (now - this.lastMoveTime >= this.moveDelay) {
                if (this.keyStates.has('ArrowLeft')) {
                    this.movePiece(-1, 0);
                }
                if (this.keyStates.has('ArrowRight')) {
                    this.movePiece(1, 0);
                }
                if (this.keyStates.has('ArrowDown')) {
                    this.movePiece(0, 1);
                }
                this.lastMoveTime = now;
            }

            // Мгновенные действия
            if (this.keyStates.has('ArrowUp')) {
                this.rotatePiece();
                this.keyStates.delete('ArrowUp');
            }
            if (this.keyStates.has(' ')) {
                this.hardDrop();
                this.keyStates.delete(' ');
            }
        }, 16); // ~60fps
    }

    setupButtons() {
        document.getElementById('startGame').addEventListener('click', () => {
            this.start();
        });

        document.getElementById('pauseGame').addEventListener('click', () => {
            this.togglePause();
        });
    }

    start() {
        this.reset();
        this.gameOverElement.style.display = 'none';
        this.generateNextPiece();
        this.spawnPiece();
        this.gameLoop();
    }

    reset() {
        this.board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameSpeed = 1000;
        this.gameOver = false;
        this.isPaused = false;
        this.nextPiece = null;
        this.updateScore();
    }

    generateNextPiece() {
        const pieces = Object.keys(TETROMINOES);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.nextPiece = {
            type: randomPiece,
            shape: TETROMINOES[randomPiece].shape,
            color: TETROMINOES[randomPiece].color
        };
    }

    spawnPiece() {
        if (!this.nextPiece) {
            this.generateNextPiece();
        }

        this.currentPiece = {
            ...this.nextPiece,
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
            y: 0
        };

        this.generateNextPiece();
        this.drawNextPiece();
    }

    drawNextPiece() {
        const ctx = this.nextPieceCtx;
        const blockSize = 30;

        // Clear the next piece canvas
        ctx.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);

        if (!this.nextPiece) return;

        const shape = this.nextPiece.shape;
        const xOffset = (this.nextPieceCanvas.width - shape[0].length * blockSize) / 2;
        const yOffset = (this.nextPieceCanvas.height - shape.length * blockSize) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawBlock(
                        col,
                        row,
                        this.nextPiece.color,
                        blockSize,
                        xOffset,
                        yOffset,
                        ctx
                    );
                }
            }
        }
    }

    movePiece(dx, dy) {
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;

        if (this.isValidMove(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        return false;
    }

    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );

        if (this.isValidMove(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
        }
    }

    hardDrop() {
        while (this.movePiece(0, 1)) {}
        this.lockPiece();
    }

    isValidMove(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    if (newX < 0 || newX >= BOARD_WIDTH ||
                        newY >= BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lockPiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardY = this.currentPiece.y + row;
                    if (boardY < 0) {
                        this.gameOver = true;
                        break;
                    }
                    this.board[boardY][this.currentPiece.x + col] = this.currentPiece.color;
                }
            }
            if (this.gameOver) break;
        }

        this.clearLines();
        if (!this.gameOver) {
            this.spawnPiece();
            // Проверяем, возможно ли разместить новую фигуру
            if (!this.isValidMove(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
                this.gameOver = true;
            }
        }

        if (this.gameOver) {
            this.handleGameOver();
        }
    }

    handleGameOver() {
        this.draw(); // Отрисовываем последнее состояние
        this.gameOverElement.style.display = 'block';
        const highScore = localStorage.getItem('tetrisHighScore') || 0;
        if (this.score > parseInt(highScore)) {
            localStorage.setItem('tetrisHighScore', this.score);
        }
    }

    clearLines() {
        let linesCleared = 0;

        for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                row++;
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;

            if (this.lines >= this.level * 20) {
                this.level++;
                this.gameSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
            }

            this.updateScore();
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);


        // Draw board
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            for (let col = 0; col < BOARD_WIDTH; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.board[row][col]);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        this.drawBlock(
                            this.currentPiece.x + col,
                            this.currentPiece.y + row,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }

        this.drawNextPiece();
    }

    drawBlock(x, y, color, size = BLOCK_SIZE, xOffset = 0, yOffset = 0, context = this.ctx) {
        const style = this.settings.blockStyle;

        context.save();
        if (style === 'gradient') {
            const gradient = context.createLinearGradient(
                xOffset + x * size,
                yOffset + y * size,
                xOffset + (x + 1) * size,
                yOffset + (y + 1) * size
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, this.lightenColor(color, 30));
            context.fillStyle = gradient;
        } else if (style === 'outlined') {
            context.fillStyle = 'transparent';
            context.strokeStyle = color;
            context.lineWidth = 2;
        } else {
            context.fillStyle = color;
        }

        context.fillRect(xOffset + x * size, yOffset + y * size, size, size);
        if (style === 'outlined') {
            context.strokeRect(xOffset + x * size, yOffset + y * size, size, size);
        }
        context.restore();
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return `#${(1 << 24 | (R < 255 ? R : 255) << 16 | (G < 255 ? G : 255) << 8 | (B < 255 ? B : 255)).toString(16).slice(1)}`;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseGame').textContent = this.isPaused ? 'Resume' : 'Pause';
    }

    gameLoop() {
        if (!this.gameOver && !this.isPaused) {
            this.draw();

            const now = Date.now();
            if (now - this.lastAutoDropTime >= this.gameSpeed) {
                if (!this.movePiece(0, 1)) {
                    this.lockPiece();
                }
                this.lastAutoDropTime = now;
            }
        }

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Tetris();
});