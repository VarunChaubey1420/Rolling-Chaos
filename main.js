import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js';

const keys = {
  left: false,
  right: false
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

// Road
const roadGeometry = new THREE.BoxGeometry(5, 0.1, 50);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
scene.add(road);

// Player (temporary cube)
const playerGeometry = new THREE.BoxGeometry(1, 1, 2);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.6;
scene.add(player);
let baseSpeed = 0.15;
let speed = baseSpeed;
let brakePower = 0.05;
let turnSpeed = 0.02;

let velocityX = 0;
let maxVelocity = 0.2;
let friction = 0.9;

keys.brake = false;

window.addEventListener('keydown', (e) => {
  if (e.key === ' ') keys.brake = true; // SPACEBAR
});

window.addEventListener('keyup', (e) => {
  if (e.key === ' ') keys.brake = false;
});

// Camera position (TPP style)
camera.position.set(0, 3, 6);

// Animate loop
function animate() {
  requestAnimationFrame(animate);

  // Movement
  // Input affects velocity
  if (keys.left) {
    velocityX -= turnSpeed;
  }
  if (keys.right) {
    velocityX += turnSpeed;
  }
  // Limit speed
  velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, velocityX));
  // Apply movement
  player.position.x += velocityX;
  // Friction (slows down when no input)
  velocityX *= friction;

  // Fake forward motion (road moves)
  road.position.z += speed;
  if (road.position.z > 25) {
    road.position.z = 0;
  }

  // Camera follow
  // Smooth follow
  camera.position.x += (player.position.x - camera.position.x) * 0.1;
  // Slight lag in Z for cinematic feel
  camera.position.z = 6 + velocityX * 5;
  camera.lookAt(player.position);

  renderer.render(scene, camera);
  player.position.x = Math.max(-2, Math.min(2, player.position.x));

  // Brake logic
if (keys.brake) {
  speed -= brakePower;
} else {
  // Recover speed smoothly
  speed += 0.01;
}

// Clamp speed
speed = Math.max(0.05, Math.min(baseSpeed, speed));
if (keys.brake) {
  player.material.color.set(0xffff00); // yellow when braking
} else {
  player.material.color.set(0xff0000);
}
}

animate();