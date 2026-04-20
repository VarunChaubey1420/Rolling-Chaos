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
  if (e.key === ' ') keys.brake = true; // Space = brake
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
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
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
   ROAD
========================= */
const roadGeometry = new THREE.BoxGeometry(5, 0.1, 50);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
scene.add(road);

/* =========================
   PLAYER (Temporary Cube)
========================= */
const playerGeometry = new THREE.BoxGeometry(1, 1, 2);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.6;
scene.add(player);

/* =========================
   GAME VARIABLES
========================= */
// Speed system
let baseSpeed = 0.15;
let speed = baseSpeed;
let brakePower = 0.05;

// Steering physics
let turnSpeed = 0.02;
let velocityX = 0;
let maxVelocity = 0.2;
let friction = 0.9;

/* =========================
   GAME LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);

  /* ----- STEERING ----- */
  if (keys.left) velocityX -= turnSpeed;
  if (keys.right) velocityX += turnSpeed;

  // Limit side velocity
  velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, velocityX));

  // Apply movement
  player.position.x += velocityX;

  // Apply friction
  velocityX *= friction;

  // Keep player on road
  player.position.x = Math.max(-2, Math.min(2, player.position.x));

  /* ----- FORWARD MOTION ----- */
  road.position.z += speed;

  // Loop road
  if (road.position.z > 25) {
    road.position.z = 0;
  }

  /* ----- BRAKE SYSTEM ----- */
  if (keys.brake) {
    speed -= brakePower;
    player.material.color.set(0xffff00); // Visual feedback
  } else {
    speed += 0.01;
    player.material.color.set(0xff0000);
  }

  // Clamp speed
  speed = Math.max(0.05, Math.min(baseSpeed, speed));

  /* ----- CAMERA FOLLOW ----- */
  camera.position.x += (player.position.x - camera.position.x) * 0.1;
  camera.position.z = 6 + velocityX * 5;
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

animate();