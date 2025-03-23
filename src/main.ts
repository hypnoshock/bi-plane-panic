import './style.css'
import * as THREE from 'three';
import { GameStateManager } from './game-states/GameStateManager';
import { MenuState } from './game-states/MenuState';

// Create scene, camera, and renderer
const scene: THREE.Scene = new THREE.Scene();
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lights
const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(1, 1, 1);
scene.add(light);

const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Position camera
camera.position.z = 5;

// Create game over screen
const gameOverScreen = document.createElement('div');
gameOverScreen.className = 'game-over';
gameOverScreen.innerHTML = 'GAME OVER<br/>Press RETURN to restart';
document.body.appendChild(gameOverScreen);

// Create FPS counter
const fpsCounter = document.createElement('div');
fpsCounter.style.position = 'absolute';
fpsCounter.style.bottom = '20px';
fpsCounter.style.right = '20px';
fpsCounter.style.color = 'white';
fpsCounter.style.fontSize = '16px';
fpsCounter.style.fontFamily = 'Arial, sans-serif';
fpsCounter.style.zIndex = '1000';
fpsCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
fpsCounter.style.padding = '8px 12px';
fpsCounter.style.borderRadius = '4px';
document.body.appendChild(fpsCounter);

// FPS calculation variables
let frameCount = 0;
let lastFpsUpdate = 0;
const fpsUpdateInterval = 500; // Update FPS display every 500ms
let lastFrameTime = 0;
let frameTimes: number[] = [];
const frameTimeHistorySize = 60; // Keep track of last 60 frames

// Create game state manager
const gameStateManager = new GameStateManager(scene, camera, renderer);

// Create and set initial state
const menuState = new MenuState(scene, camera, renderer);
menuState.setGameStateManager(gameStateManager);
gameStateManager.setState(menuState);

let lastTime = 0;

// Animation loop
function animate(currentTime: number): void {
    requestAnimationFrame(animate);
    
    // Calculate deltaTime in seconds
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Track frame times for more accurate FPS calculation
    if (lastFrameTime > 0) {
        frameTimes.push(currentTime - lastFrameTime);
        if (frameTimes.length > frameTimeHistorySize) {
            frameTimes.shift();
        }
    }
    lastFrameTime = currentTime;
    
    // Update FPS counter with more detailed information
    frameCount++;
    if (currentTime - lastFpsUpdate >= fpsUpdateInterval) {
        // Calculate average frame time from history
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const fps = Math.round(1000 / avgFrameTime);
        
        // Calculate min and max frame times
        const minFrameTime = Math.min(...frameTimes);
        const maxFrameTime = Math.max(...frameTimes);
        
        fpsCounter.textContent = `FPS: ${fps} | Frame Time: ${avgFrameTime.toFixed(2)}ms | Min: ${minFrameTime.toFixed(2)}ms | Max: ${maxFrameTime.toFixed(2)}ms`;
        frameCount = 0;
        lastFpsUpdate = currentTime;
    }
    
    gameStateManager.update(deltaTime);
    gameStateManager.render();
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Start animation
animate(0); 