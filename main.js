import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js';

/* =========================
   INPUT SYSTEM
========================= */
const keys = {
  left: false,
  right: false,
  brake: false
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  if (e.key === ' ') keys.brake = true;

  // Restart
  if ((e.key === 'r' || e.key === 'R') && isGameOver) {
    restartGame();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  if (e.key === ' ') keys.brake = false;
});

/* =========================
   SCENE SETUP
========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

/* =========================
   CAMERA
========================= */
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 6);

/* =========================
   RENDERER
========================= */
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* =========================
   LIGHTING
========================= */
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

/* =========================
   ROAD SYSTEM
========================= */
const roadGeometry = new THREE.BoxGeometry(5, 0.1, 50);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

const roads = [];
const roadLength = 50;
const roadCount = 3;

for (let i = 0; i < roadCount; i++) {
  const road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.position.z = i * -roadLength;

  // Road lines
  const lineGeometry = new THREE.BoxGeometry(0.2, 0.05, 5);
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let j = 0; j < 5; j++) {
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.z = j * -10;
    line.position.y = 0.06;
    road.add(line);
  }

  scene.add(road);
  roads.push(road);
}

/* =========================
   PLAYER
========================= */
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 2),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
player.position.y = 0.6;
player.position.z = 0;
scene.add(player);

/* =========================
   GAME VARIABLES
========================= */
let baseSpeed = 0.15;
let speed = baseSpeed;
let brakePower = 0.05;

let turnSpeed = 0.02;
let velocityX = 0;
let maxVelocity = 0.2;
let friction = 0.9;

let isGameOver = false;

let score = 0;
let scoreSpeed = 10;

/* =========================
   UI
========================= */
const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("gameOver");
gameOverEl.style.display = "none";

/* =========================
   OBSTACLES
========================= */
const obstacles = [];
let spawnTimer = 0;
let spawnInterval = 100;

function spawnObstacle() {
  const obs = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x0000ff })
  );

  obs.position.x = (Math.random() * 4) - 2;
  obs.position.y = 0.5;
  obs.position.z = -60;

  scene.add(obs);
  obstacles.push(obs);
}

/* =========================
   RESTART
========================= */
function restartGame() {
  isGameOver = false;
  speed = baseSpeed;
  velocityX = 0;
  score = 0;

  player.position.x = 0;
  player.material.color.set(0xff0000);

  obstacles.forEach((obs) => scene.remove(obs));
  obstacles.length = 0;

  gameOverEl.style.display = "none";
}

/* =========================
   GAME LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);

  if (!isGameOver) {

    /* ----- MOVEMENT ----- */
    if (keys.left) velocityX -= turnSpeed;
    if (keys.right) velocityX += turnSpeed;

    velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, velocityX));
    player.position.x += velocityX;
    velocityX *= friction;

    player.position.x = Math.max(-2, Math.min(2, player.position.x));

    /* ----- ROAD ----- */
    roads.forEach((road) => {
      road.position.z += speed;
      if (road.position.z > roadLength) {
        road.position.z -= roadLength * roadCount;
      }
    });

    /* ----- BRAKE ----- */
    if (keys.brake) {
      speed -= brakePower;
      player.material.color.set(0xffff00);
    } else {
      speed += 0.01;
      player.material.color.set(0xff0000);
    }

    speed = Math.max(0.05, Math.min(baseSpeed, speed));

    /* ----- SPAWN ----- */
    spawnTimer++;
    if (spawnTimer > spawnInterval) {
      spawnObstacle();
      spawnTimer = 0;
    }

    /* ----- OBSTACLES ----- */
    obstacles.forEach((obs, index) => {
      obs.position.z += speed;

      if (obs.position.z > 10) {
        scene.remove(obs);
        obstacles.splice(index, 1);
      }
    });

    /* ----- COLLISION ----- */
    const playerBox = new THREE.Box3().setFromObject(player);

    obstacles.forEach((obs) => {
      const obsBox = new THREE.Box3().setFromObject(obs);

      if (playerBox.intersectsBox(obsBox)) {
        isGameOver = true;
        player.material.color.set(0x000000);
        gameOverEl.style.display = "block";
      }
    });

    /* ----- SCORE ----- */
    score += speed * scoreSpeed;
  }

  /* ----- CAMERA ----- */
  camera.position.x += (player.position.x - camera.position.x) * 0.1;
  camera.position.z = 6 + velocityX * 5;
  camera.lookAt(player.position);

  renderer.render(scene, camera);

  scoreEl.innerText = Math.floor(score);
}

animate();