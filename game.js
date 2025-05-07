class Snake {
    constructor() {
        this.reset();
    }

    reset() {
        this.position = [{x: 10, y: 10}];
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.grew = false;
        this.speed = 150; // 初始速度
    }

    update() {
        this.direction = this.nextDirection;
        const head = this.position[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        this.position.unshift(newHead);
        if (!this.grew) {
            this.position.pop();
        }
        this.grew = false;
    }

    grow() {
        this.grew = true;
        // 每吃到5个食物加快速度
        if (this.position.length % 5 === 0) {
            this.speed = Math.max(50, this.speed - 10);
        }
    }

    setDirection(direction) {
        if (this.direction.x + direction.x === 0 && this.direction.y + direction.y === 0) {
            return;
        }
        this.nextDirection = direction;
    }

    checkCollision(width, height) {
        const head = this.position[0];
        if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
            return true;
        }

        for (let i = 1; i < this.position.length; i++) {
            if (head.x === this.position[i].x && head.y === this.position[i].y) {
                return true;
            }
        }
        return false;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.startButton = document.getElementById('start-btn');

        this.gridSize = 20;
        this.width = this.canvas.width / this.gridSize;
        this.height = this.canvas.height / this.gridSize;

        this.snake = new Snake();
        this.food = {x: 15, y: 15};
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameInterval = null;
        this.isGameOver = false;

        this.setupEventListeners();
        this.drawWelcomeScreen();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const directions = {
                'ArrowLeft': {x: -1, y: 0},
                'ArrowRight': {x: 1, y: 0},
                'ArrowUp': {x: 0, y: -1},
                'ArrowDown': {x: 0, y: 1}
            };

            if (directions[e.key]) {
                e.preventDefault();
                this.snake.setDirection(directions[e.key]);
            }

            // 按空格键重新开始游戏
            if (e.code === 'Space' && this.isGameOver) {
                this.start();
            }
        });

        this.startButton.addEventListener('click', () => this.start());
    }

    generateFood() {
        while (true) {
            const newFood = {
                x: Math.floor(Math.random() * this.width),
                y: Math.floor(Math.random() * this.height)
            };

            let onSnake = false;
            for (const segment of this.snake.position) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    onSnake = true;
                    break;
                }
            }

            if (!onSnake) {
                this.food = newFood;
                break;
            }
        }
    }

    update() {
        this.snake.update();

        const head = this.snake.position[0];
        if (head.x === this.food.x && head.y === this.food.y) {
            this.snake.grow();
            this.score += 10;
            this.scoreElement.textContent = `分数: ${this.score}`;
            this.generateFood();

            // 更新最高分
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
            }
        }

        if (this.snake.checkCollision(this.width, this.height)) {
            this.gameOver();
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        this.ctx.strokeStyle = '#34495e';
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                this.ctx.strokeRect(
                    i * this.gridSize,
                    j * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
            }
        }

        // 绘制蛇
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(1, '#27ae60');
        this.ctx.fillStyle = gradient;

        for (const segment of this.snake.position) {
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        }

        // 绘制食物
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    drawWelcomeScreen() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('按开始游戏或空格键开始', this.canvas.width / 2, this.canvas.height / 2);

        if (this.highScore > 0) {
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`最高分: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
    }

    start() {
        this.snake.reset();
        this.score = 0;
        this.isGameOver = false;
        this.scoreElement.textContent = `分数: ${this.score}`;
        this.generateFood();
        this.startButton.textContent = '重新开始';

        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }

        this.gameInterval = setInterval(() => this.gameLoop(), this.snake.speed);
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameInterval);

        // 绘制半透明遮罩
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制游戏结束文本
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2 - 30);

        // 显示最终分数
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`最终分数: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText(`最高分: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        // 显示重新开始提示
        this.ctx.font = '18px Arial';
        this.ctx.fillText('按空格键重新开始', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }
}

// 创建游戏实例
const game = new Game();