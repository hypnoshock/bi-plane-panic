import * as THREE from 'three';
import { GameState } from './GameState';
import { KeyboardHandler } from '../systems/input-handlers/KeyboardHandler';
import { ScreenControlHandler } from '../systems/input-handlers/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/input-handlers/JoypadInputHandler';
import { GameStateManager } from './GameStateManager';
import { MenuState } from './MenuState';
import { AudioSystem } from '../systems/AudioSystem';

export class PlayState implements GameState {
    private keyboardHandler!: KeyboardHandler;
    private screenControlHandler!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private gameStateManager!: GameStateManager;
    private backgroundTexture: THREE.CanvasTexture | null = null;
    private audioSystem: AudioSystem;
    private cube: THREE.Mesh;

    // Input flags
    private inputFlags = {
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false
    };

    constructor(
        private scene: THREE.Scene,
        private camera: THREE.PerspectiveCamera,
        private renderer: THREE.WebGLRenderer
    ) {
        // Create audio system
        this.audioSystem = new AudioSystem();

        // Create cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.cube = new THREE.Mesh(geometry, material);
        scene.add(this.cube);

        // Position camera
        camera.position.z = 5;
    }

    private setupBackground(): void {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 2;
        canvas.height = 512;
        if (context) {
            const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#008080');  // teal
            gradient.addColorStop(1, '#004040');  // darker teal
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        this.backgroundTexture = new THREE.CanvasTexture(canvas);
        this.backgroundTexture.needsUpdate = true;
        this.scene.background = this.backgroundTexture;
    }

    public setInputHandlers(
        keyboardHandler: KeyboardHandler,
        screenControlHandler: ScreenControlHandler,
        joypadHandler: JoypadInputHandler
    ): void {
        this.keyboardHandler = keyboardHandler;
        this.screenControlHandler = screenControlHandler;
        this.joypadHandler = joypadHandler;

        const inputHandler = (event: string, isPress: boolean) => {
            this.handleInput(event, isPress);
        };

        this.keyboardHandler.setEventHandler(inputHandler);
        this.screenControlHandler.setEventHandler(inputHandler);
        this.joypadHandler.setEventHandler(inputHandler);
    }

    private handleInput(event: string, isPress: boolean): void {
        switch (event) {
            case 'up':
                this.inputFlags.moveUp = isPress;
                break;
            case 'down':
                this.inputFlags.moveDown = isPress;
                break;
            case 'left':
                this.inputFlags.moveLeft = isPress;
                break;
            case 'right':
                this.inputFlags.moveRight = isPress;
                break;
            case 'button2':
                if (isPress) {
                    const menuState = new MenuState(this.scene, this.camera, this.renderer);
                    menuState.setGameStateManager(this.gameStateManager);
                    this.gameStateManager.setState(menuState);
                }
                break;
        }
    }

    public setGameStateManager(manager: GameStateManager): void {
        this.gameStateManager = manager;
    }

    public enter(): void {
        this.setupBackground();
        this.audioSystem.playMusic();
        
        // Show controls only on mobile devices
        if (this.isMobileDevice()) {
            this.screenControlHandler.showControls();
        } else {
            this.screenControlHandler.hideControls();
        }
    }

    private isMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    public exit(): void {
        // Stop music
        this.audioSystem.stopMusic();
        this.audioSystem.cleanup();

        // Clean up background texture
        if (this.backgroundTexture) {
            this.backgroundTexture.dispose();
            this.backgroundTexture = null;
        }
        this.scene.background = null;

        // Remove cube
        this.scene.remove(this.cube);
    }

    public update(deltaTime: number): void {
        // Handle cube movement
        const moveSpeed = 5 * deltaTime;
        
        if (this.inputFlags.moveUp) {
            this.cube.position.y += moveSpeed;
        }
        if (this.inputFlags.moveDown) {
            this.cube.position.y -= moveSpeed;
        }
        if (this.inputFlags.moveLeft) {
            this.cube.position.x -= moveSpeed;
        }
        if (this.inputFlags.moveRight) {
            this.cube.position.x += moveSpeed;
        }

        // Add some rotation for visual interest
        this.cube.rotation.x += deltaTime;
        this.cube.rotation.y += deltaTime;

        this.keyboardHandler.update();
        this.screenControlHandler.update();
        this.joypadHandler.update();
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
} 