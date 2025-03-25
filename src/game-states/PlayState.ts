import * as THREE from 'three';
import { GameState } from './GameState';
import { KeyboardHandler } from '../systems/input-handlers/KeyboardHandler';
import { ScreenControlHandler } from '../systems/input-handlers/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/input-handlers/JoypadInputHandler';
import { GameStateManager } from './GameStateManager';
import { MenuState } from './MenuState';
import { AudioSystem } from '../systems/AudioSystem';
import { Player } from '../game-objects/Player';
import { PlaneModel } from '../assets/game-models/PlaneModel';
import { BulletSystem } from '../systems/BulletSystem';

export class PlayState implements GameState {
    private keyboardHandler!: KeyboardHandler;
    private screenControlHandler!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private gameStateManager!: GameStateManager;
    private backgroundTexture: THREE.CanvasTexture | null = null;
    private audioSystem: AudioSystem;
    private player: Player;
    private bulletSystem: BulletSystem;

    // Input flags
    private inputFlags = {
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false,
        shoot: false
    };

    constructor(
        private scene: THREE.Scene,
        private camera: THREE.PerspectiveCamera,
        private renderer: THREE.WebGLRenderer
    ) {
        // Create audio system
        this.audioSystem = new AudioSystem();
        this.bulletSystem = new BulletSystem(this.scene, this.audioSystem);

        // Create player with a blue plane model
        const planeModel = new PlaneModel(0x4169e1);
        this.player = new Player(planeModel);
        this.player.setBulletSystem(this.bulletSystem);
        scene.add(this.player.getGroup());

        // Position camera
        camera.position.z = 10;
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
            case 'button1':
                this.inputFlags.shoot = isPress;
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

        // Remove player
        this.scene.remove(this.player.getGroup());
    }

    public update(deltaTime: number): void {
        // Handle player movement
        if (this.inputFlags.moveUp) {
            this.player.moveUp(deltaTime);
        }
        if (this.inputFlags.moveDown) {
            this.player.moveDown(deltaTime);
        }
        if (this.inputFlags.moveLeft) {
            this.player.moveLeft(deltaTime);
        }
        if (this.inputFlags.moveRight) {
            this.player.moveRight(deltaTime);
        }
        if (this.inputFlags.shoot) {
            this.player.shoot(deltaTime);
        }

        // Update player
        this.player.update(deltaTime);

        // Update bullet system
        this.bulletSystem.update(deltaTime);

        this.keyboardHandler.update();
        this.screenControlHandler.update();
        this.joypadHandler.update();
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
} 