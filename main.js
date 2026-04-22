import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js';

/* =========================
   INPUT SYSTEM
========================= */
const keys = {
  left: false,
  right: false,
  brake: false,
  accelerate:false
  
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  if (e.key === ' ') keys.brake = true;
  if (e.key === 'ArrowUp' || e.key === 'w')keys.accelerate = true;

  
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  if (e.key === ' ') keys.brake = false;
  if (e.key === 'ArrowUp' || e.key === 'w')keys.accelerate = false;
});
// Button click
document.getElementById("startBtn").addEventListener("click", startGame);

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
const renderer = new THREE.WebGLRenderer({ antialias: true });

// 🔥 CRITICAL FIX
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Force fullscreen
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.width = "100vw";
renderer.domElement.style.height = "100vh";
renderer.domElement.style.zIndex = "-1";

document.getElementById("gameContainer").appendChild(renderer.domElement);

/* =========================
   LIGHTING
========================= */
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);
function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resizeRenderer); 

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
scene.add(player);

/* =========================
   GAME VARIABLES
========================= */
let speed = 0;
let acceleration = 0.002;
let maxSpeed = 0.2;
let brakePower = 0.05;

let turnSpeed = 0.02;
let velocityX = 0;
let maxVelocity = 0.2;
let friction = 0.9;


let isGameStarted = false;

/* =========================
   UI
========================= */
const startScreen = document.getElementById("startScreen");

function startGame() {
  if (isGameStarted) return; // prevent double trigger

  isGameStarted = true;

  startScreen.style.transition = "opacity 0.5s";
  startScreen.style.opacity = "0";

  setTimeout(() => {
    startScreen.style.display = "none";
  }, 500);
}

/* =========================
   GAME LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);

  if (isGameStarted) {

    /* MOVEMENT */
    if (keys.left) velocityX -= turnSpeed;
    if (keys.right) velocityX += turnSpeed;

    velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, velocityX));
    player.position.x += velocityX;
    velocityX *= friction;

    player.position.x = Math.max(-2, Math.min(2, player.position.x));

    /* ROTATION */
    player.rotation.y = -velocityX * 2;

    /* SPEED */
    if (!keys.brake) {
      speed += acceleration;
    } else {
      speed -= brakePower;
    }

    speed = Math.max(0.05, Math.min(maxSpeed, speed));

    /* ROAD */
    roads.forEach((road) => {
      road.position.z += speed;
      if (road.position.z > roadLength) {
        road.position.z -= roadLength * roadCount;
      }
    });

  }

  /* CAMERA */
  camera.position.x += (player.position.x - camera.position.x) * 0.1;
  camera.rotation.z = -velocityX * 0.3;
  camera.position.z = 6 + Math.abs(velocityX) * 3;
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

animate();