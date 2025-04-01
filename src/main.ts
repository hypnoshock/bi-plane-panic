import './style.css'
import * as THREE from 'three';
import { GameStateManager } from './game-states/GameStateManager';
import { MenuState } from './game-states/MenuState';
import { PlayState } from './game-states/PlayState';
import { AudioSystem } from './systems/AudioSystem';
import { PortalState } from './game-states/PortalState';
import { GameSettings } from './systems/GameSettings';

function isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

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
    width: 100dvw;
    height: 100dvh;
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
    width: min(100dvw, 100dvh * 16/9);
    height: min(100dvh, 100dvw * 9/16);
    background-color: #000;
`;
gameContainer.id = 'game-container';
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

// Create UI container. This layer maintains the 16:9 aspect ratio as it's 100% width and height of the game container
const uiContainer = document.createElement('div');
uiContainer.id = 'ui-container';
uiContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
`;
gameContainer.appendChild(uiContainer);

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
    bottom: 20rem;
    left: 20rem;
    color: white;
    font-size: 16rem;
    font-family: Arial, sans-serif;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 8rem 12rem;
    border-radius: 4rem;
    display: ${SHOW_FPS_COUNTER ? 'block' : 'none'};
`;
uiContainer.appendChild(fpsCounter);

// Create fullscreen button
const fullscreenButton = document.createElement('button');
fullscreenButton.style.cssText = `
    position: absolute;
    top: 20rem;
    right: 20rem;
    width: ${isMobileDevice() ? '120rem' : '60rem'};
    height: ${isMobileDevice() ? '120rem' : '60rem'};
    background: rgba(0, 0, 0, 0.5);
    border: 2rem solid white;
    border-radius: 50%;
    color: white;
    font-size: ${isMobileDevice() ? '70rem' : '34rem'};
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
`;

fullscreenButton.innerHTML = '⛶';
uiContainer.appendChild(fullscreenButton);

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
    
    fullscreenButton.innerHTML = isFullscreen ? '↙' : '⛶';
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
    bottom: 20rem;
    right: 20rem;
    width: ${isMobileDevice() ? '120rem' : '60rem'};
    height: ${isMobileDevice() ? '120rem' : '60rem'};
    background: rgba(0, 0, 0, 0.5);
    border: 2rem solid white;
    border-radius: 50%;
    color: white;
    font-size: ${isMobileDevice() ? '70rem' : '34rem'};
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
`;
muteButton.innerHTML = '🔊';
uiContainer.appendChild(muteButton);

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
const gameStateManager = new GameStateManager(audioSystem, uiContainer);

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
    const playState = new PlayState(scene, camera, renderer, audioSystem, uiContainer);
    playState.setGameStateManager(gameStateManager);
    gameStateManager.setState(playState);
}

function startMenuState() {
    const menuState = new MenuState(scene, camera, renderer, audioSystem, uiContainer);
    menuState.setGameStateManager(gameStateManager);
    gameStateManager.setState(menuState);
}

function startPortalState() {
    const portalState = new PortalState(scene, camera, renderer, audioSystem, uiContainer);
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

// Add function to update root font size
function updateRootFontSize() {
    // Reference resolution is 1920x1080
    const REFERENCE_WIDTH = 1920;
    
    // Scale factor based on current container width compared to reference width
    const scale = gameContainer.clientWidth / REFERENCE_WIDTH;
    
    // Set font size so that 1rem = 1px at 1920x1080
    document.documentElement.style.fontSize = `${scale}px`;
}

// Call initially
updateRootFontSize();

// Handle window resize
window.addEventListener('resize', () => {
    updateRendererSize();
});

// Handle window unload
window.addEventListener('unload', () => {
    gameStateManager.cleanup();
});

function updateRendererSize() {
    renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
    camera.aspect = 16/9;
    camera.updateProjectionMatrix();
    updateRootFontSize();
}

GameSettings.getInstance().updateRendererSizeCallback = updateRendererSize;

// Start animation
animate(0);
