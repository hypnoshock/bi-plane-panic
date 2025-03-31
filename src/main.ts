import './style.css'
import * as THREE from 'three';
import { GameStateManager } from './game-states/GameStateManager';
import { MenuState } from './game-states/MenuState';
import { PlayState } from './game-states/PlayState';
import { AudioSystem } from './systems/AudioSystem';
import { PortalState } from './game-states/PortalState';

// Create scene, camera, and renderer
const scene: THREE.Scene = new THREE.Scene();

// Create audio system
const audioSystem = new AudioSystem();

// Create main container that takes up the full viewport
const container = document.createElement('div');
container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000;
    overflow: hidden;
`;
document.body.appendChild(container);

// Create game container with 16:9 aspect ratio
const gameContainer = document.createElement('div');
gameContainer.style.cssText = `
    position: relative;
    width: min(100vw, 100vh * 16/9);
    height: min(100vh, 100vw * 9/16);
    background-color: #000;
`;
container.appendChild(gameContainer);

// Create camera with 16:9 aspect ratio
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
renderer.domElement.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
`;
gameContainer.appendChild(renderer.domElement);

// Add lights
const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(1, 1, 1);
scene.add(light);

const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Position camera
camera.position.z = 5;

// Create FPS counter
const SHOW_FPS_COUNTER = false;
const fpsCounter = document.createElement('div');
fpsCounter.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    color: white;
    font-size: 16px;
    font-family: Arial, sans-serif;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 8px 12px;
    border-radius: 4px;
    display: ${SHOW_FPS_COUNTER ? 'block' : 'none'};
`;
gameContainer.appendChild(fpsCounter);

// Create fullscreen button
const fullscreenButton = document.createElement('button');
fullscreenButton.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid white;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all 0.2s ease;
`;
fullscreenButton.innerHTML = '⛶';
gameContainer.appendChild(fullscreenButton);

// Function to handle fullscreen
const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        // Try standard fullscreen API first
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        }
        // Fallback for iOS
        else if ((document as any).webkitFullscreenElement === null) {
            (document.documentElement as any).webkitRequestFullscreen();
        }
        // Fallback for older browsers
        else if ((document as any).mozFullScreenElement === null) {
            (document.documentElement as any).mozRequestFullScreen();
        }
        // Fallback for MS Edge
        else if ((document as any).msFullscreenElement === null) {
            (document.documentElement as any).msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
        }
    }
};

// Update fullscreen button icon
const updateFullscreenIcon = () => {
    const isFullscreen = document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement;
    
    fullscreenButton.innerHTML = isFullscreen ? '⮌' : '⛶';
};

// Add event listeners for fullscreen changes
document.addEventListener('fullscreenchange', updateFullscreenIcon);
document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

// Add click handler for fullscreen button
fullscreenButton.addEventListener('click', toggleFullscreen);

// Create mute button
const muteButton = document.createElement('button');
muteButton.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid white;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all 0.2s ease;
`;
muteButton.innerHTML = '🔊';
gameContainer.appendChild(muteButton);

// Function to handle muting
let isMuted = false;
const toggleMute = () => {
    isMuted = !isMuted;
    if (audioSystem) {
        const masterGain = audioSystem.getMasterGainNode();
        masterGain.gain.setValueAtTime(isMuted ? 0 : 1, audioSystem.getAudioContext().currentTime);
        muteButton.innerHTML = isMuted ? '🔇' : '🔊';
    }
};

// Add click handler for mute button
muteButton.addEventListener('click', toggleMute);

// FPS calculation variables
let frameCount = 0;
let lastFpsUpdate = 0;
const fpsUpdateInterval = 500; // Update FPS display every 500ms
let lastFrameTime = 0;
let frameTimes: number[] = [];
const frameTimeHistorySize = 60; // Keep track of last 60 frames

// Create game state manager
const gameStateManager = new GameStateManager(audioSystem);

// Check for query string 'portal'
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('portal') === 'true') {
    startPortalState();
} else {
    // Create and set initial state
    startMenuState();
}

let lastTime = 0;

function startPlayState() {
    const playState = new PlayState(scene, camera, renderer, audioSystem);
    playState.setGameStateManager(gameStateManager);
    gameStateManager.setState(playState);
}

function startMenuState() {
    const menuState = new MenuState(scene, camera, renderer, audioSystem);
    menuState.setGameStateManager(gameStateManager);
    gameStateManager.setState(menuState);
}

function startPortalState() {
    const portalState = new PortalState(scene, camera, renderer, audioSystem);
    portalState.setGameStateManager(gameStateManager);
    gameStateManager.setState(portalState);
}

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
    renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
    camera.aspect = 16/9;
    camera.updateProjectionMatrix();
});

// Handle window unload
window.addEventListener('unload', () => {
    gameStateManager.cleanup();
});

// Start animation
animate(0);

// Add orientation check for mobile devices
const orientationMessage = document.createElement('div');
orientationMessage.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    display: none;
    z-index: 2000;
    font-family: Arial, sans-serif;
`;
gameContainer.appendChild(orientationMessage);

function checkOrientation() {
    if (window.innerWidth < window.innerHeight && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        orientationMessage.style.display = 'block';
    } else {
        orientationMessage.style.display = 'none';
    }
}

// Check orientation on load and resize
window.addEventListener('load', checkOrientation);
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation); 