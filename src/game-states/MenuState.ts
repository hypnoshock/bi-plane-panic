import { GameState } from './GameState';
import * as THREE from 'three';
import { GameStateManager } from './GameStateManager';
import { PlayState } from './PlayState';
import { KeyboardHandler } from '../systems/KeyboardHandler';
import { AudioSystem } from '../systems/AudioSystem';
import { ScreenControlHandler } from '../systems/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/JoypadInputHandler';

export class MenuState implements GameState {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private gameStateManager!: GameStateManager;
    private menuContainer!: HTMLDivElement;
    private selectedOption: number = 0;
    private options: string[] = ['Start Game', 'Toggle Fullscreen'];
    private keyboardHandler!: KeyboardHandler;
    private screenControlHandler!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private backgroundTexture: THREE.CanvasTexture | null = null;
    private audioSystem: AudioSystem;

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.audioSystem = new AudioSystem();
        this.setupMenu();
    }

    private setupBackground(): void {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 2;
        canvas.height = 512;
        if (context) {
            const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#000000');  // black
            gradient.addColorStop(1, '#00008b');  // dark blue
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        this.backgroundTexture = new THREE.CanvasTexture(canvas);
        this.backgroundTexture.needsUpdate = true;
        this.scene.background = this.backgroundTexture;
    }

    private setupMenu(): void {
        this.menuContainer = document.createElement('div');
        this.menuContainer.style.position = 'absolute';
        this.menuContainer.style.top = '50%';
        this.menuContainer.style.left = '50%';
        this.menuContainer.style.transform = 'translate(-50%, -50%)';
        this.menuContainer.style.textAlign = 'center';
        this.menuContainer.style.color = 'white';
        this.menuContainer.style.fontFamily = 'Arial, sans-serif';
        this.menuContainer.style.fontSize = 'min(6vh, 32px)';
        this.menuContainer.style.zIndex = '1000';
        this.menuContainer.style.touchAction = 'none';
        document.body.appendChild(this.menuContainer);
    }

    private setupInputHandlers(): void {
        const inputHandler = (event: string, isPress: boolean) => {
            if (!isPress) return;

            switch (event) {
                case 'up':
                    this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
                    break;
                case 'down':
                    this.selectedOption = (this.selectedOption + 1) % this.options.length;
                    break;
                case 'button1':
                case 'button2':
                    this.handleSelection();
                    break;
            }
            this.updateMenuDisplay();
        }

        this.keyboardHandler.setEventHandler(inputHandler);
        this.screenControlHandler.setEventHandler(inputHandler);
        this.joypadHandler.setEventHandler(inputHandler);
    }

    public setInputHandlers(
        keyboardHandler: KeyboardHandler,
        screenControlHandler: ScreenControlHandler,
        joypadHandler: JoypadInputHandler
    ): void {
        this.keyboardHandler = keyboardHandler;
        this.screenControlHandler = screenControlHandler;
        this.joypadHandler = joypadHandler;
        this.setupInputHandlers();
    }

    private handleSelection(): void {
        switch (this.selectedOption) {
            case 0: // Start Game
                const playState = new PlayState(this.scene, this.camera, this.renderer);
                playState.setGameStateManager(this.gameStateManager);
                this.gameStateManager.setState(playState);
                break;
            case 1: // Toggle Fullscreen
                this.toggleFullscreen();
                break;
        }
    }

    private toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    private updateMenuDisplay(): void {
        this.menuContainer.innerHTML = `
            <style>
                @keyframes gentleRotate {
                    0% { transform: rotate(-2deg); }
                    50% { transform: rotate(2deg); }
                    100% { transform: rotate(-2deg); }
                }
                .title {
                    font-size: min(12vh, 72px);
                    font-weight: bold;
                    margin-bottom: min(5vh, 40px);
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                    animation: gentleRotate 3s ease-in-out infinite;
                    display: inline-block;
                }
                .menu-item {
                    margin: min(2vh, 20px);
                    cursor: pointer;
                    padding: min(1vh, 10px);
                    transition: color 0.2s ease;
                }
                .menu-item:hover {
                    color: #ff6666;
                }
            </style>
            <div class="title">Game Template</div>
            ${this.options.map((option, index) => 
                `<div class="menu-item" 
                    style="${index === this.selectedOption ? 'color: #ff0000;' : ''}"
                    onclick="window.dispatchEvent(new CustomEvent('menuSelect', { detail: ${index} }))"
                    ontouchstart="this.style.color='#ff6666'"
                    ontouchend="this.style.color='${index === this.selectedOption ? '#ff0000' : 'white'}'">
                    ${option}
                </div>`
            ).join('')}
        `;

        const handleMenuSelect = (event: CustomEvent) => {
            this.selectedOption = event.detail;
            this.handleSelection();
        };

        window.addEventListener('menuSelect', handleMenuSelect as EventListener);
        
        const cleanup = () => {
            window.removeEventListener('menuSelect', handleMenuSelect as EventListener);
        };
        
        (this.menuContainer as any)._cleanup = cleanup;
    }

    enter(): void {
        this.setupBackground();
        this.updateMenuDisplay();
        this.audioSystem.playMenuMusic();
        this.screenControlHandler.hideControls();
    }

    exit(): void {
        this.menuContainer.remove();
        this.audioSystem.stopMenuMusic();
        this.audioSystem.cleanup();

        if (this.backgroundTexture) {
            this.backgroundTexture.dispose();
            this.backgroundTexture = null;
        }
        this.scene.background = null;
    }

    update(): void {
        this.keyboardHandler.update();
        this.screenControlHandler.update();
        this.joypadHandler.update();
    }

    render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    setGameStateManager(manager: GameStateManager): void {
        this.gameStateManager = manager;
    }
} 