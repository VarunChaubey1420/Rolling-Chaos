import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js';

/* =========================
   INPUT SYSTEM
========================= */
const keys = {
  left: false,
  right: false,
  brake: false,
  accelerate:false,
  boost: false
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'a') keys.left = true;
  if (e.key === 'd') keys.right = true;
  if (e.code === 'Space') keys.brake = true;
  if (e.key === 'w')keys.accelerate = true;
  if (e.code === 'ShiftLeft') keys.boost = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'a') keys.left = false;
  if (e.key === 'd') keys.right = false;
  if (e.code === 'Space') keys.brake = false;
  if (e.key === 'w')keys.accelerate = false;
  if (e.code === 'ShiftLeft') keys.boost = false;
});

// Button click
document.getElementById("startBtn").addEventListener("click", startGame);

/* =========================
   SCENE SETUP
========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 10, 60);

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

// 🛣️ Main road
const roadGeometry = new THREE.BoxGeometry(8, 0.1, 50);
const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2b2b
});
const roads = [];
const roadLength = 50;
const roadCount = 3;
for (let i = 0; i < roadCount; i++) {
  const road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.position.z = i * -roadLength;

  /* =========================
     ROAD LANE LINES
  ========================= */
  const lineGeometry = new THREE.BoxGeometry(0.15, 0.02, 4);
  const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff
  });
  for (let j = 0; j < 6; j++) {
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.z = j * -8;
    line.position.y = 0.06;
    road.add(line);
  }

  /* =========================
     ROAD BORDERS
  ========================= */

  const borderGeometry = new THREE.BoxGeometry(0.3, 0.12, 50);

  const borderMaterial = new THREE.MeshStandardMaterial({
    color: 0xff2222
  });

  // LEFT BORDER
  const leftBorder = new THREE.Mesh(borderGeometry, borderMaterial);
  leftBorder.position.x = -4.1;

  // RIGHT BORDER
  const rightBorder = new THREE.Mesh(borderGeometry, borderMaterial);
  rightBorder.position.x = 4.1;

  road.add(leftBorder);
  road.add(rightBorder);

  /* =========================
     ADD ROAD TO SCENE
  ========================= */

  scene.add(road);
  roads.push(road);
}

/* =========================
   PLAYER (ARCADE STYLE)
========================= */

const player = new THREE.Group();

/* ----- MAIN BODY ----- */
const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.5, 2),
  new THREE.MeshStandardMaterial({
    color: 0x0066ff
  })
);

body.position.y = 0.6;
player.add(body);

/* ----- REAR BOOST PANEL ----- */
const rear = new THREE.Mesh(
  new THREE.BoxGeometry(1, 0.3, 0.3),
  new THREE.MeshStandardMaterial({
    color: 0x00ccff,
    emissive: 0x001122
  })
);

rear.position.set(0, 0.6, -1);

player.add(rear);

/* ----- BIG SIDE WHEELS ----- */
const wheelGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.25, 32);

const wheelMaterial = new THREE.MeshStandardMaterial({
  color: 0x111111
});

// LEFT
const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
leftWheel.rotation.z = Math.PI / 2;
leftWheel.position.set(-0.9, 0.5, 0);

player.add(leftWheel);

// RIGHT
const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
rightWheel.rotation.z = Math.PI / 2;
rightWheel.position.set(0.9, 0.5, 0);

player.add(rightWheel);

/* ----- FRONT MINI WHEELS ----- */
const smallWheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);

// LEFT FRONT
const frontLeft = new THREE.Mesh(smallWheelGeometry, wheelMaterial);
frontLeft.rotation.z = Math.PI / 2;
frontLeft.position.set(-0.4, 0.2, 0.8);

player.add(frontLeft);

// RIGHT FRONT
const frontRight = new THREE.Mesh(smallWheelGeometry, wheelMaterial);
frontRight.rotation.z = Math.PI / 2;
frontRight.position.set(0.4, 0.2, 0.8);

player.add(frontRight);

/* ----- POSITION ----- */
player.position.y = 0.2;

scene.add(player);

/* =========================
   GAME VARIABLES
========================= */
let speed = 0;
let acceleration = 0.004;   // faster pickup
let maxSpeed = 0.5;        // higher top speed
let brakePower = 0.01;      // smooth braking (not instant)
let naturalFriction = 0.995; // slow decay when no input
let turnSpeed = 0.02;
let velocityX = 0;
let maxVelocity = 0.2;
let friction = 0.92;
let isGameStarted = false;
let grip = 0.92;          // normal grip
let driftGrip = 0.85;     // lower grip while drifting
let isDrifting = false;
let boostMeter = 0;
let maxBoost = 100;
let isBoosting = false;
let boostPower = 0.008;
let targetCameraZ = 6;

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
const boostBar = document.getElementById("boostBar");
/* =========================
   GAME LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);
  if (isGameStarted) {
    isDrifting = speed > 0.1 && keys.brake && (
      (keys.left && velocityX <= 0) || 
      (keys.right && velocityX >= 0)
    );

    // 🚗 Steering only works when moving
    if (speed > 0.01) {

      // steering strength depends on speed
      const steerFactor = (speed / maxSpeed) * 0.8;

      // combine input into one value
      let steerInput = 0;
      if (keys.left) steerInput -= 1;
      if (keys.right) steerInput += 1;
      if (speed > 0.01) {
        const steerFactor = speed / maxSpeed;
        velocityX += steerInput * turnSpeed * steerFactor;
      }
      if (!keys.left && !keys.right) {
        velocityX *= 0.95;
      }
    }

    // clamp velocity
    velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, velocityX));

    // apply movement
    player.position.x += velocityX;

    // friction (stronger when slow)
    velocityX *= (speed > 0.05) ? friction : 0.7;

    if (isDrifting) {
      if (velocityX > 0) {
        velocityX *= 0.88;
      } else if (velocityX < 0) {
        velocityX *= 0.88;
      }
      velocityX += (keys.right ? 0.002 : 0);
      velocityX -= (keys.left ? 0.002 : 0);
      boostMeter += 0.7;
    } else {
      velocityX *= 0.94;
    }
    let boostedMaxSpeed = isBoosting ? 0.7 : maxSpeed;
    speed = Math.max(0, Math.min(boostedMaxSpeed, speed));

    // stop completely when speed is zero
    if (speed < 0.01) {
      velocityX = 0;
    }
    if (Math.abs(velocityX) < 0.0001) velocityX = 0;

    // 🚀 MANUAL BOOST
    if (keys.boost && boostMeter > 0) {
      isBoosting = true;
      speed += boostPower;
      boostMeter -= 0.2;
    } else {
      isBoosting = false;
    }

    // 🚀 BOOST
    if (isBoosting) {
      speed += boostPower;
      boostMeter -= 2;
      boostBar.style.boxShadow = "0 0 20px #ffe600";
      // stop boost when empty
      if (boostMeter <= 0) {
        boostMeter = 0;
        isBoosting = false;
      }
    } else {
      boostBar.style.boxShadow = "none";
    }
    // ⚡ Update boost UI
    boostBar.style.width = `${(boostMeter / maxBoost) * 100}%`;

    // 🚧 BOUNDARY FIX (IMPORTANT)
    if (player.position.x <= -3.5 || player.position.x >= 3.5) {
      velocityX *= 0.5; // dampen instead of killing direction
    }
    // boundary
    player.position.x = Math.max(-3.5, Math.min(3.5, player.position.x));
    player.rotation.y = -velocityX * (isDrifting ? 5 : 2);

    // 🚗 ACCELERATION
    if (keys.accelerate) {
      speed += acceleration;
      // 🔥 slight curve (less boost at high speed)
      speed -= speed * 0.01;
    }

    // 🛑 BRAKE (strong but smooth)
    if (keys.brake) {
      if (keys.left || keys.right) {
        // 🔥 drifting → less braking, more sliding
        speed -= brakePower * 0.5;
      } else {
        // normal braking
        speed -= brakePower + speed * 0.03;
      }
    }
    
    // 🧊 NATURAL SLOWDOWN
    if (!keys.accelerate && !keys.brake) {
      speed *= naturalFriction;
    }

    // clamp
    speed = Math.max(0, Math.min(maxSpeed, speed));

    /* ROAD */
    roads.forEach((road) => {
      road.position.z += speed;
      if (road.position.z > roadLength) {
        road.position.z -= roadLength * roadCount;
      }
      road.rotation.z = velocityX * -0.08;
    });

  }

  /* CAMERA */
  camera.position.x += (player.position.x - camera.position.x) * 0.1;
  camera.rotation.z = -velocityX * 0.3;
  // 🎥 Dynamic target camera distance
  targetCameraZ = 6 + Math.abs(velocityX) * 3 - speed * (isBoosting ? 5 : 2);
  // 🔥 Smooth transition
  camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
  let targetFOV = isBoosting ? 85 : 75;
  camera.fov += (targetFOV - camera.fov) * 0.08;
  camera.updateProjectionMatrix();
  camera.lookAt(player.position);
  renderer.render(scene, camera);
  
}

animate();