// Game Constants
const GRID_SIZE = 20;
const TILE_SIZE = 20;
const BASE_SPEED = 150;
const SPEED_INCREMENT = 2;
const MAX_SPEED = 50;

// Game Elements
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverDisplay = document.getElementById('game-over');

// Game Variables
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gameInterval;
let gameSpeed = BASE_SPEED;
let lastRenderTime = 0;

// Initialize Game
function initGame() {
    // Set canvas size
    const size = Math.min(window.innerWidth - 40, 400);
    canvas.width = size;
    canvas.height = size;
    
    // Initialize snake
    snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    
    // Reset game speed
    gameSpeed = BASE_SPEED;
    
    // Generate first food
    generateFood();
    
    // Reset score
    score = 0;
    scoreDisplay.textContent = score;
    highScoreDisplay.textContent = highScore;
    
    // Hide game over display
    gameOverDisplay.style.display = 'none';
    
    // Initial draw
    drawGame();
}

// Draw Game Elements
function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (optional)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * (canvas.width / GRID_SIZE), 0);
        ctx.lineTo(i * (canvas.width / GRID_SIZE), canvas.height);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * (canvas.height / GRID_SIZE));
        ctx.lineTo(canvas.width, i * (canvas.height / GRID_SIZE));
        ctx.stroke();
    }
    
    // Draw snake
    snake.forEach((segment, index) => {
        const size = canvas.width / GRID_SIZE;
        ctx.fillStyle = index === 0 ? 'var(--snake-head)' : 'var(--snake-body)';
        ctx.beginPath();
        ctx.roundRect(
            segment.x * size, 
            segment.y * size, 
            size, 
            size, 
            size * 0.2
        );
        ctx.fill();
        
        // Draw eyes on head
        if (index === 0) {
            const eyeSize = size * 0.2;
            const pupilSize = size * 0.1;
            const offset = size * 0.25;
            
            ctx.fillStyle = 'white';
            
            // Left eye
            ctx.beginPath();
            ctx.arc(
                segment.x * size + offset,
                segment.y * size + offset,
                eyeSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Right eye
            ctx.beginPath();
            ctx.arc(
                segment.x * size + size - offset,
                segment.y * size + offset,
                eyeSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = 'black';
            let pupilOffsetX = 0;
            let pupilOffsetY = 0;
            
            switch(direction) {
                case 'up': pupilOffsetY = -size * 0.05; break;
                case 'down': pupilOffsetY = size * 0.05; break;
                case 'left': pupilOffsetX = -size * 0.05; break;
                case 'right': pupilOffsetX = size * 0.05; break;
            }
            
            // Left pupil
            ctx.beginPath();
            ctx.arc(
                segment.x * size + offset + pupilOffsetX,
                segment.y * size + offset + pupilOffsetY,
                pupilSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Right pupil
            ctx.beginPath();
            ctx.arc(
                segment.x * size + size - offset + pupilOffsetX,
                segment.y * size + offset + pupilOffsetY,
                pupilSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });
    
    // Draw food
    const size = canvas.width / GRID_SIZE;
    ctx.fillStyle = 'var(--food)';
    ctx.beginPath();
    ctx.roundRect(
        food.x * size, 
        food.y * size, 
        size, 
        size, 
        size * 0.5
    );
    ctx.fill();
    
    // Draw food details
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(
        food.x * size + size * 0.3,
        food.y * size + size * 0.3,
        size * 0.1,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(
        food.x * size + size * 0.7,
        food.y * size + size * 0.4,
        size * 0.15,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(
        food.x * size + size * 0.5,
        food.y * size + size * 0.7,
        size * 0.1,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Game Logic
function updateGame() {
    // Move snake
    const head = {...snake[0]};
    
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Check wall collisions
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver();
        return;
    }
    
    // Check self collisions
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.textContent = score;
        
        // Increase speed (capped at MAX_SPEED)
        if (gameSpeed > MAX_SPEED) {
            gameSpeed -= SPEED_INCREMENT;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        generateFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
    
    // Update direction
    direction = nextDirection;
}

// Game Loop
function gameLoop() {
    updateGame();
    drawGame();
}

// Generate Food
function generateFood() {
    let validPosition = false;
    
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        
        // Make sure food doesn't appear on snake
        validPosition = !snake.some(
            segment => segment.x === food.x && segment.y === food.y
        );
    }
}

// Game Over
function gameOver() {
    clearInterval(gameInterval);
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreDisplay.textContent = highScore;
    }
    
    // Show game over screen
    finalScoreDisplay.textContent = score;
    gameOverDisplay.style.display = 'block';
}

// Start Game
function startGame() {
    if (gameRunning) {
        clearInterval(gameInterval);
    }
    
    initGame();
    gameRunning = true;
    startBtn.textContent = 'Restart Game';
    
    gameInterval = setInterval(gameLoop, gameSpeed);
}

// Event Listeners
document.addEventListener('keydown', e => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
});

// Mobile Controls
document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (!gameRunning) return;
        
        const directionMap = {
            'up': () => { if (direction !== 'down') nextDirection = 'up'; },
            'down': () => { if (direction !== 'up') nextDirection = 'down'; },
            'left': () => { if (direction !== 'right') nextDirection = 'left'; },
            'right': () => { if (direction !== 'left') nextDirection = 'right'; }
        };
        
        if (this.classList.contains('up')) directionMap.up();
        if (this.classList.contains('down')) directionMap.down();
        if (this.classList.contains('left')) directionMap.left();
        if (this.classList.contains('right')) directionMap.right();
    });
});

// Button Events
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    gameOverDisplay.style.display = 'none';
    startGame();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (gameRunning) {
        const size = Math.min(window.innerWidth - 40, 400);
        canvas.width = size;
        canvas.height = size;
        drawGame();
    }
});

// Initialize on load
initGame();
