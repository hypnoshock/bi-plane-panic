import { GameState } from './GameState';
import * as THREE from 'three';
import { GameStateManager } from './GameStateManager';
import { PlayState } from './PlayState';
import { KeyboardHandler } from '../systems/input-handlers/KeyboardHandler';
import { AudioSystem } from '../systems/AudioSystem';
import { ScreenControlHandler } from '../systems/input-handlers/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/input-handlers/JoypadInputHandler';
import { MusicSystem } from '../systems/MusicSystem';
import { MenuPlane } from '../game-objects/MenuPlane';
import { GameSettings } from '../systems/GameSettings';

export class MenuState implements GameState {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private gameStateManager!: GameStateManager;
    private menuContainer: HTMLElement = document.createElement('div');
    private uiContainer: HTMLElement;
    private selectedOption: number = 0;
    private options: string[] = ['1 Player', '2 Player', 'Toggle Fullscreen'];
    private keyboardHandler!: KeyboardHandler;
    private screenControlHandler!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private backgroundTexture: THREE.CanvasTexture | null = null;
    private audioSystem: AudioSystem;
    private musicSystem: MusicSystem;
    private lastBeat: number = 0;
    private colorIndex: number = 0;
    private menuPlanes: MenuPlane[] = [];
    private colors: string[] = [
        '#00008b', // Dark Blue
        '#4b0082', // Indigo
        '#800080', // Purple
        '#8b0000', // Dark Red
        '#006400', // Dark Green
        '#483d8b', // Dark Slate Blue
        '#8b4513', // Saddle Brown
        '#2f4f4f', // Dark Slate Gray
        '#8b008b', // Dark Magenta
        '#008b8b', // Dark Cyan
        '#8b0000', // Dark Red
        '#006400', // Dark Green
        '#483d8b', // Dark Slate Blue
        '#8b4513', // Saddle Brown
        '#2f4f4f', // Dark Slate Gray
        '#8b008b'  // Dark Magenta
    ];

    constructor(
        scene: THREE.Scene, 
        camera: THREE.PerspectiveCamera, 
        renderer: THREE.WebGLRenderer,
        audioSystem: AudioSystem,
        uiContainer: HTMLElement
    ) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.audioSystem = audioSystem;
        this.musicSystem = new MusicSystem(this.audioSystem);
        this.uiContainer = uiContainer;
        this.setupMenu();

        // Position camera
        camera.position.z = 5;
        camera.position.y = 0;
        camera.position.x = 0;
    }

    private setupBackground(): void {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 2;
        canvas.height = 512;
        if (context) {
            this.updateBackgroundGradient(context);
        }

        this.backgroundTexture = new THREE.CanvasTexture(canvas);
        this.backgroundTexture.needsUpdate = true;
        this.scene.background = this.backgroundTexture;
    }

    private updateBackgroundGradient(context: CanvasRenderingContext2D): void {
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        const currentColor = this.colors[this.colorIndex];
        const nextColor = this.colors[(this.colorIndex + 1) % this.colors.length];
        
        gradient.addColorStop(0, '#000000');  // Always black at top
        gradient.addColorStop(0.5, currentColor);
        gradient.addColorStop(1, nextColor);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 2, 512);
    }

    private updateBackground(): void {
        if (this.backgroundTexture && this.musicSystem.getCurrentBeat() !== this.lastBeat) {
            this.lastBeat = this.musicSystem.getCurrentBeat();
            this.colorIndex = (this.colorIndex + 1) % this.colors.length;
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 2;
            canvas.height = 512;
            if (context) {
                this.updateBackgroundGradient(context);
                this.backgroundTexture.image = canvas;
                this.backgroundTexture.needsUpdate = true;
            }
        }
    }

    private setupMenu(): void {
        this.menuContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 65rem;
            z-index: 1000;
            touch-action: none;
        `;
        this.uiContainer.appendChild(this.menuContainer);
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
            case 0: // 1 Player
                GameSettings.getInstance().isTwoPlayer = false;
                const playState1 = new PlayState(this.scene, this.camera, this.renderer, this.audioSystem, this.uiContainer);
                playState1.setGameStateManager(this.gameStateManager);
                this.gameStateManager.setState(playState1);
                break;
            case 1: // 2 Player
                GameSettings.getInstance().isTwoPlayer = true;
                const playState2 = new PlayState(this.scene, this.camera, this.renderer, this.audioSystem, this.uiContainer);
                playState2.setGameStateManager(this.gameStateManager);
                this.gameStateManager.setState(playState2);
                break;
            case 2: // Toggle Fullscreen
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

    private setupMenuPlanes(): void {
        // Create 8 planes with different colors and patterns
        const planeColors = [
            0xff0000, // Red
            0x00ff00, // Green
            0x0000ff, // Blue
            0xffff00, // Yellow
            0xff00ff, // Magenta
            0x00ffff, // Cyan
            0xff8800, // Orange
            0x8800ff  // Purple
        ];
        
        // Define positions in a larger circle
        const positions = [
            new THREE.Vector3(-4, 0, -4),  // Top-left
            new THREE.Vector3(4, 0, -4),   // Top-right
            new THREE.Vector3(-4, 0, 4),   // Bottom-left
            new THREE.Vector3(4, 0, 4),    // Bottom-right
            new THREE.Vector3(0, 0, -4),   // Top
            new THREE.Vector3(0, 0, 4),    // Bottom
            new THREE.Vector3(-4, 0, 0),   // Left
            new THREE.Vector3(4, 0, 0)     // Right
        ];

        // Define initial rotations
        const rotations = [
            new THREE.Euler(0, 0, 0),
            new THREE.Euler(0, Math.PI / 2, 0),
            new THREE.Euler(0, Math.PI, 0),
            new THREE.Euler(0, -Math.PI / 2, 0),
            new THREE.Euler(0, Math.PI / 4, 0),
            new THREE.Euler(0, -Math.PI / 4, 0),
            new THREE.Euler(0, Math.PI / 2, 0),
            new THREE.Euler(0, -Math.PI / 2, 0)
        ];

        for (let i = 0; i < 8; i++) {
            const plane = new MenuPlane(
                planeColors[i],
                positions[i],
                rotations[i],
                i * Math.PI / 4, // Offset each plane's beat
                i % 4 // Cycle through the 4 dance patterns
            );
            this.scene.add(plane.getGroup());
            this.menuPlanes.push(plane);
        }
    }

    private cleanupMenuPlanes(): void {
        this.menuPlanes.forEach(plane => {
            this.scene.remove(plane.getGroup());
        });
        this.menuPlanes = [];
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
                    font-size: 129rem;
                    font-weight: bold;
                    margin-bottom: 50rem;
                    text-shadow: 2rem 2rem 4rem rgba(0, 0, 0, 0.5);
                    animation: gentleRotate 3s ease-in-out infinite;
                    display: inline-block;
                }
                .menu-item {
                    margin: 20rem;
                    cursor: pointer;
                    padding: 10rem;
                    transition: color 0.2s ease;
                }
                .menu-item:hover {
                    color: #ff6666;
                }
            </style>
            <div class="title">Bi-Plane Panic</div>
            ${this.options.map((option, index) => 
                `<div class="menu-item" 
                    style="${index === this.selectedOption ? 'color: #ff0000; font-weight: bold;' : ''}"
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

    async enter(): Promise<void> {
        this.setupBackground();
        this.setupMenuPlanes();
        this.updateMenuDisplay();
        await this.musicSystem.loadTrack('menu-music.json');
        this.musicSystem.play();
        this.screenControlHandler.hideControls();
    }

    exit(): void {
        this.menuContainer.remove();
        this.cleanupMenuPlanes();
        this.musicSystem.stop();
        this.musicSystem.cleanup();


        if (this.backgroundTexture) {
            this.backgroundTexture.dispose();
            this.backgroundTexture = null;
        }
        this.scene.background = null;
    }

    update(): void {
        this.musicSystem.update();
        this.keyboardHandler.update();
        this.screenControlHandler.update();
        this.joypadHandler.update();
        this.updateBackground();
        
        // Update all menu planes
        this.menuPlanes.forEach(plane => {
            plane.update(this.musicSystem);
        });
    }

    render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    setGameStateManager(manager: GameStateManager): void {
        this.gameStateManager = manager;
    }
} 