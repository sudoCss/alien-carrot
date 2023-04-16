import readline from "readline";

const GAME_TIME_INtERVAL = 1000 / 60; // fps

const NEW_ENEMY_INTERVAL = 1000;

const NEW_FOOD_INTERVAL = 2000;

const MOVE_INTERVAL = 100;

const SCORE_UPDATE_INTERVAL = 300;

const GAME_IS = ["waiting", "playing", "over"];
const WAITING = 0;
const PLAYING = 1;
const OVER = 2;

const GAME_WIDTH = 30;

const KEYS = {
    escape: "escape",
    spaceBar: "space",
    left: "left",
    right: "right",
};

const BLOCKS = {
    wall: "🧱",
    player: "👽",
    enemy: "👹",
    food: "🥕",
    empty: "  ",
};

class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

let gameState = GAME_IS[WAITING];

let player;
let enemies;
let foods;
let score;
let timeSinceLastEnemy;
let timeSinceLastFood;
let timeSinceLastMove;
let timeSinceLastScoreUpdate;

registerKeyListener();

initGame();

startGame();

function registerKeyListener() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on("keypress", (str, key) => {
        if (key.ctrl && key.name === "c") {
            process.exit(0);
        }
        handleInput(key.name);
    });
}

function handleInput(key) {
    if (gameState === GAME_IS[PLAYING]) {
        if (key === KEYS.left) {
            if (player.x > 2) player.x--;
        } else if (key === KEYS.right) {
            if (player.x < GAME_WIDTH - 1) player.x++;
        }
    } else {
        if (key === KEYS.spaceBar) {
            initGame();
            gameState = GAME_IS[PLAYING];
        } else if (key === KEYS.escape) {
            process.exit(0);
        }
    }
}

function initGame() {
    player = new Entity(Math.round(GAME_WIDTH / 2), process.stdout.rows - 3);
    score = 0;
    enemies = [];
    foods = [];
    timeSinceLastEnemy = 0;
    timeSinceLastFood = 0;
    timeSinceLastMove = 0;
    timeSinceLastScoreUpdate = 0;
}

function startGame() {
    let lastUpdate = new Date().getTime();
    setInterval(() => {
        let currentUpdate = new Date().getTime();
        let delta = currentUpdate - lastUpdate;
        lastUpdate = currentUpdate;

        update(delta);
        draw();
    }, GAME_TIME_INtERVAL);
}

function update(delta) {
    if (gameState !== GAME_IS[PLAYING]) return;

    timeSinceLastEnemy += delta;
    timeSinceLastFood += delta;
    timeSinceLastMove += delta;
    timeSinceLastScoreUpdate += delta;

    if (timeSinceLastEnemy > NEW_ENEMY_INTERVAL) {
        enemies.push(
            new Entity(Math.round(Math.random() * GAME_WIDTH - 2) + 1, 1)
        );

        timeSinceLastEnemy = 0;
    }

    if (timeSinceLastFood > NEW_FOOD_INTERVAL) {
        foods.push(
            new Entity(Math.round(Math.random() * GAME_WIDTH - 2) + 1, 1)
        );

        timeSinceLastFood = 0;
    }

    if (timeSinceLastMove > MOVE_INTERVAL) {
        enemies.forEach((enemy) => {
            enemy.y++;
            enemy.x += [1, -1][Math.round(Math.random())];
            if (enemy.x === 1) enemy.x = 2;
            else if (enemy.x === GAME_WIDTH) enemies.x = GAME_WIDTH - 1;
        });
        foods.forEach((food) => {
            food.y++;
        });

        if (enemies.length > 0 && enemies[0].y > process.stdout.rows) {
            enemies.shift();
        }
        if (foods.length > 0 && foods[0].y > process.stdout.rows) {
            foods.shift();
        }

        timeSinceLastMove = 0;
    }

    if (timeSinceLastScoreUpdate > SCORE_UPDATE_INTERVAL) {
        score += 2;
        timeSinceLastScoreUpdate = 0;
    }
}

function draw() {
    process.stdout.write(
        process.platform === "win32"
            ? "\x1B[2J\x1B[0f"
            : "\x1B[2J\x1B[3J\x1B[H",
    );
    switch (gameState) {
        case GAME_IS[WAITING]:
            waitingScreen();
            break;
        case GAME_IS[PLAYING]:
            gameScreen();
            break;
        case GAME_IS[OVER]:
            gameOverScreen();
            break;
        default:
            process.exit(1);
            break;
    }
}

function waitingScreen() {
    for (let c = 1; c <= process.stdout.rows; c++) {
        if (c === Math.round(process.stdout.rows / 2)) {
            console.log("Press space bar on your keyboard to play!");
            console.log("  Press escape on your keyboard to exit");
            c++;
            continue;
        }
        console.log();
    }
}

function gameScreen() {
    const width = GAME_WIDTH;
    const height = process.stdout.rows;

    let enemiesGraph = new Map();
    enemies.forEach((enemy, index) => {
        enemiesGraph[`${enemy.x} ${enemy.y}`] = [index];
    });

    let foodsGraph = new Map();
    foods.forEach((food, index) => {
        foodsGraph[`${food.x} ${food.y}`] = [index];
    });

    for (let c = 1; c <= height; c++) {
        let line = "";
        for (let c2 = 1; c2 <= width; c2++) {
            if (c2 === 1 || c2 === width) {
                line += BLOCKS.wall;
            } else if (c === player.y && c2 === player.x) {
                line += BLOCKS.player;
                if (enemiesGraph[`${player.x} ${player.y}`]) {
                    gameState = GAME_IS[OVER];
                } else if (foodsGraph[`${player.x} ${player.y}`]) {
                    score += 100;
                    foods.splice(foodsGraph[`${player.x} ${player.y}`], 1);
                }
            } else if (enemiesGraph[`${c2} ${c}`]) {
                line += BLOCKS.enemy;
            } else if (foodsGraph[`${c2} ${c}`]) {
                line += BLOCKS.food;
            } else {
                line += BLOCKS.empty;
            }
        }

        if (c === height) {
            line += `Your Score: ${score}`;
        }

        console.log(line);
    }
}

function gameOverScreen() {
    for (let c = 1; c <= process.stdout.rows; c++) {
        if (c === Math.round(process.stdout.rows / 2)) {
            console.log("                Game Over");
            console.log(`              Your Score is ${score}`);
            console.log("Press space bar on your keyboard to play again!");
            console.log("     Press escape on your keyboard to exit");
            c += 3;
            continue;
        }
        console.log();
    }
}
