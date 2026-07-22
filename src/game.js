
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const adOverlay = document.getElementById('ad-overlay');
const restartBtn = document.getElementById('restart-btn');

let player = { x: 20, y: 200, width: 20, height: 15, speed: 4 };
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];
let keys = { up: false, down: false, fire: false };
let score = 0;
let level = 1;
let gameOver = false;
let frameCount = 0;
let bossActive = false;
let boss = null;

function init() {
    player.y = 200;
    bullets = []; enemies = []; particles = []; stars = [];
    score = 0; level = 1; gameOver = false; frameCount = 0;
    bossActive = false; boss = null;
    scoreElement.innerText = score;
    adOverlay.style.display = 'none';
    
    for(let i=0; i<50; i++) {
        stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, speed: Math.random()*2+1 });
    }
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (gameOver) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function fire() {
    if (frameCount % 10 === 0) { 
        bullets.push({ x: player.x + player.width, y: player.y + player.height/2 - 2, w: 10, h: 4, speed: 8 });
    }
}

function createExplosion(x, y, color='#ffffff') {
    for(let i=0; i<15; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6,
            life: 20 + Math.random()*10, color: color
        });
    }
}

function spawnEnemy() {
    if (bossActive) return;

    let r = Math.random();
    let y = Math.random() * (canvas.height - 20);
    
    if (level === 1) {
        // Basic Red
        enemies.push({ x: canvas.width, y: y, w: 20, h: 20, speed: Math.random()*2 + 2, hp: 1, type: 'basic', color: '#ff0000' });
    } else if (level === 2) {
        if (r < 0.3) enemies.push({ x: canvas.width, y: y, w: 15, h: 10, speed: 6, hp: 1, type: 'interceptor', color: '#ffff00' });
        else enemies.push({ x: canvas.width, y: y, w: 20, h: 20, speed: Math.random()*2 + 2, hp: 1, type: 'basic', color: '#ff0000' });
    } else if (level === 3) {
        if (r < 0.2) enemies.push({ x: canvas.width, y: y, w: 30, h: 30, speed: 1.5, hp: 5, type: 'asteroid', color: '#888888' });
        else if (r < 0.5) enemies.push({ x: canvas.width, y: y, w: 15, h: 10, speed: 6, hp: 1, type: 'interceptor', color: '#ffff00' });
        else enemies.push({ x: canvas.width, y: y, w: 20, h: 20, speed: Math.random()*2 + 2, hp: 1, type: 'basic', color: '#ff0000' });
    } else if (level === 4) {
        if (r < 0.3) enemies.push({ x: canvas.width, y: y, w: 25, h: 15, speed: 3, hp: 2, type: 'wave', color: '#ff00ff', startY: y });
        else if (r < 0.5) enemies.push({ x: canvas.width, y: y, w: 30, h: 30, speed: 1.5, hp: 5, type: 'asteroid', color: '#888888' });
        else enemies.push({ x: canvas.width, y: y, w: 15, h: 10, speed: 6, hp: 1, type: 'interceptor', color: '#ffff00' });
    }
}

function updateLevel() {
    if (score < 100) level = 1;
    else if (score < 300) level = 2;
    else if (score < 600) level = 3;
    else if (score < 1000) level = 4;
    else if (score >= 1000 && !bossActive && !boss) {
        level = 5;
        bossActive = true;
        enemies = []; // Clear normal enemies
        boss = { x: canvas.width + 50, y: canvas.height/2 - 40, w: 60, h: 80, hp: 100, maxHp: 100, phase: 0 };
    }
}

function updateBoss() {
    if (!boss) return;
    
    // Enter screen
    if (boss.x > canvas.width - 80) boss.x -= 1;
    else {
        // Move up and down
        boss.y += Math.sin(frameCount * 0.05) * 2;
        
        // Fire lasers
        if (frameCount % 40 === 0) {
            enemies.push({ x: boss.x, y: boss.y + 10, w: 15, h: 5, speed: 6, hp: 1, type: 'boss_laser', color: '#ff00ff', vx: -6, vy: -1 });
            enemies.push({ x: boss.x, y: boss.y + boss.h - 15, w: 15, h: 5, speed: 6, hp: 1, type: 'boss_laser', color: '#ff00ff', vx: -6, vy: 1 });
            enemies.push({ x: boss.x, y: boss.y + boss.h/2, w: 15, h: 5, speed: 6, hp: 1, type: 'boss_laser', color: '#ff00ff', vx: -6, vy: 0 });
        }
    }
}

function update() {
    frameCount++;
    updateLevel();

    // Player Movement
    if (keys.up && player.y > 0) player.y -= player.speed;
    if (keys.down && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys.fire) fire();

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].speed;
        if (bullets[i].x > canvas.width) bullets.splice(i, 1);
    }

    // Boss Logic
    if (bossActive) updateBoss();
    else if (frameCount % Math.max(10, 40 - level * 5) === 0) spawnEnemy();

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        
        if (e.type === 'wave') e.y = e.startY + Math.sin(frameCount * 0.1) * 30;
        else if (e.type === 'boss_laser') { e.x += e.vx; e.y += e.vy; }
        else e.x -= e.speed;
        
        // Player Collision
        if (player.x < e.x + e.w && player.x + player.width > e.x &&
            player.y < e.y + e.h && player.y + player.height > e.y) {
            endGame(); return;
        }
        
        // Remove offscreen
        if (e.x + e.w < 0) { enemies.splice(i, 1); continue; }
    }

    // Boss Collision with Bullets
    if (bossActive && boss) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (b.x < boss.x + boss.w && b.x + b.w > boss.x &&
                b.y < boss.y + boss.h && b.y + b.h > boss.y) {
                
                createExplosion(b.x, b.y, '#ff00ff');
                bullets.splice(j, 1);
                boss.hp--;
                score += 5;
                
                if (boss.hp <= 0) {
                    // Boss Destroyed!
                    createExplosion(boss.x + 30, boss.y + 40, '#ffffff');
                    createExplosion(boss.x + 10, boss.y + 10, '#ff0000');
                    createExplosion(boss.x + 50, boss.y + 70, '#ffff00');
                    bossActive = false; boss = null;
                    score += 5000;
                    endGame("VICTORY!");
                }
                break;
            }
        }
    }

    // Enemy Collision with Bullets
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        let hit = false;
        
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (b.x < e.x + e.w && b.x + b.w > e.x &&
                b.y < e.y + e.h && b.y + b.h > e.y) {
                
                bullets.splice(j, 1);
                e.hp--;
                if (e.hp <= 0) {
                    createExplosion(e.x + e.w/2, e.y + e.h/2, e.color);
                    hit = true;
                    if (e.type === 'asteroid') score += 50;
                    else score += 10;
                } else {
                    createExplosion(b.x, b.y, '#ffffff'); // Sparks on armor
                }
                break;
            }
        }
        
        if (hit) enemies.splice(i, 1);
    }

    scoreElement.innerText = score + " [Lvl " + level + "]";

    // Particles & Stars
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx; particles[i].y += particles[i].vy;
        particles[i].life--;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    for (let s of stars) {
        s.x -= s.speed * (level * 0.5 + 0.5); // Stars move faster on higher levels
        if (s.x < 0) { s.x = canvas.width; s.y = Math.random() * canvas.height; }
    }
}

function draw() {
    ctx.fillStyle = '#100010'; // Dark Purple Synthwave
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#550055';
    for (let s of stars) ctx.fillRect(s.x, s.y, 2, 2);

    // Player (Neon Yellow/Pink)
    ctx.shadowBlur = 10; ctx.shadowColor = '#ff00ff'; ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height/2);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.fill();

    // Bullets (Cyan)
    ctx.shadowColor = '#00ffff'; ctx.fillStyle = '#00ffff';
    for (let b of bullets) ctx.fillRect(b.x, b.y, b.w, b.h);

    // Enemies
    for (let e of enemies) {
        ctx.shadowColor = e.color; ctx.fillStyle = e.color;
        if (e.type === 'asteroid') {
            ctx.shadowBlur = 0; ctx.fillStyle = '#555555';
            ctx.fillRect(e.x, e.y, e.w, e.h);
            // Draw damage state
            if (e.hp < 5) { ctx.fillStyle = '#222222'; ctx.fillRect(e.x+5, e.y+5, e.w-10, e.h-10); }
        } else {
            ctx.shadowBlur = 10;
            ctx.fillRect(e.x, e.y, e.w, e.h);
        }
    }
    
    // Boss
    if (bossActive && boss) {
        ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20; ctx.fillStyle = '#880000';
        ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(boss.x + 10, boss.y + 10, 20, 20); // Eye
        ctx.fillRect(boss.x + 10, boss.y + 50, 20, 20); // Eye
        
        // Boss Healthbar
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#550000'; ctx.fillRect(boss.x, boss.y - 15, boss.w, 5);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(boss.x, boss.y - 15, boss.w * (boss.hp / boss.maxHp), 5);
    }

    // Particles
    for (let p of particles) {
        ctx.shadowColor = p.color; ctx.shadowBlur = 10; ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    }
    
    ctx.shadowBlur = 0;
}

function endGame(msg = "GAME OVER") {
    gameOver = true;
    adOverlay.style.display = 'flex';
    adOverlay.querySelector('h1').innerText = msg;
}

restartBtn.addEventListener('click', init);

// Controls
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
    if (e.key === ' ' || e.key === 'Enter') keys.fire = true;
});
window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
    if (e.key === ' ' || e.key === 'Enter') keys.fire = false;
});

const btnU = document.getElementById('btn-up'); const btnD = document.getElementById('btn-down'); const btnF = document.getElementById('btn-fire');
btnU.addEventListener('touchstart', e => { e.preventDefault(); keys.up = true; });
btnU.addEventListener('touchend', e => { e.preventDefault(); keys.up = false; });
btnD.addEventListener('touchstart', e => { e.preventDefault(); keys.down = true; });
btnD.addEventListener('touchend', e => { e.preventDefault(); keys.down = false; });
if(btnF) {
    btnF.addEventListener('touchstart', e => { e.preventDefault(); keys.fire = true; });
    btnF.addEventListener('touchend', e => { e.preventDefault(); keys.fire = false; });
}

init();
