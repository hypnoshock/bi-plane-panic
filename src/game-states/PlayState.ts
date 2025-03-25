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
import { ExplosionSystem } from '../systems/ExplosionSystem';
import { CollisionSystem } from '../systems/CollisionSystem';

export class PlayState implements GameState {
    private keyboardHandler!: KeyboardHandler;
    private screenControlHandler!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private gameStateManager!: GameStateManager;
    private backgroundTexture: THREE.CanvasTexture | null = null;
    private audioSystem: AudioSystem;
    private player1: Player;
    private player2: Player;
    private bulletSystem: BulletSystem;
    private explosionSystem: ExplosionSystem;
    private collisionSystem: CollisionSystem;

    // Input flags for player 1 (keyboard/screen)
    private player1InputFlags = {
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false,
        shoot: false
    };

    // Input flags for player 2 (joypad)
    private player2InputFlags = {
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
        this.explosionSystem = new ExplosionSystem(this.scene, this.audioSystem);
        this.collisionSystem = new CollisionSystem(this.bulletSystem, this.explosionSystem);

        // Create player 1 with a blue plane model
        const planeModel1 = new PlaneModel(0x4169e1);
        this.player1 = new Player(planeModel1, 0);
        this.player1.setBulletSystem(this.bulletSystem);
        this.player1.getGroup().position.set(-5, 0, 0); // Position on the left
        scene.add(this.player1.getGroup());

        // Create player 2 with a red plane model
        const planeModel2 = new PlaneModel(0xff0000);
        this.player2 = new Player(planeModel2, 1);
        this.player2.setBulletSystem(this.bulletSystem);
        this.player2.getGroup().position.set(5, 0, 0); // Position on the right
        scene.add(this.player2.getGroup());

        // Add players to collision system
        this.collisionSystem.addPlayer(this.player1);
        this.collisionSystem.addPlayer(this.player2);

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

        // Set up player 1 controls (keyboard and screen)
        this.keyboardHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));
        this.screenControlHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));

        // Set up player 2 controls (joypad)
        this.joypadHandler.setEventHandler((event, isPress) => inputHandler(`player2_${event}`, isPress));
    }

    private handleInput(event: string, isPress: boolean): void {
        // Player 1 controls (keyboard/screen)
        if (event.startsWith('player1_')) {
            const action = event.replace('player1_', '');
            switch (action) {
                case 'up':
                    this.player1InputFlags.moveUp = isPress;
                    break;
                case 'down':
                    this.player1InputFlags.moveDown = isPress;
                    break;
                case 'left':
                    this.player1InputFlags.moveLeft = isPress;
                    break;
                case 'right':
                    this.player1InputFlags.moveRight = isPress;
                    break;
                case 'button1':
                    this.player1InputFlags.shoot = isPress;
                    break;
            }
        }
        // Player 2 controls (joypad)
        else if (event.startsWith('player2_')) {
            const action = event.replace('player2_', '');
            switch (action) {
                case 'up':
                    this.player2InputFlags.moveUp = isPress;
                    break;
                case 'down':
                    this.player2InputFlags.moveDown = isPress;
                    break;
                case 'left':
                    this.player2InputFlags.moveLeft = isPress;
                    break;
                case 'right':
                    this.player2InputFlags.moveRight = isPress;
                    break;
                case 'button1':
                    this.player2InputFlags.shoot = isPress;
                    break;
            }
        }
        // Menu control
        else if (event === 'button2' && isPress) {
            const menuState = new MenuState(this.scene, this.camera, this.renderer);
            menuState.setGameStateManager(this.gameStateManager);
            this.gameStateManager.setState(menuState);
        }
    }

    public setGameStateManager(manager: GameStateManager): void {
        this.gameStateManager = manager;
    }

    public enter(): void {
        this.setupBackground();

        // Disabled while in development
        // this.audioSystem.playMusic();
        
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

        // Remove players
        this.scene.remove(this.player1.getGroup());
        this.scene.remove(this.player2.getGroup());
    }

    public update(deltaTime: number): void {
        // Handle player 1 movement
        if (this.player1InputFlags.moveUp) {
            this.player1.moveUp(deltaTime);
        }
        if (this.player1InputFlags.moveDown) {
            this.player1.moveDown(deltaTime);
        }
        if (this.player1InputFlags.moveLeft) {
            this.player1.moveLeft(deltaTime);
        }
        if (this.player1InputFlags.moveRight) {
            this.player1.moveRight(deltaTime);
        }
        if (this.player1InputFlags.shoot) {
            this.player1.shoot(deltaTime);
        }

        // Handle player 2 movement
        if (this.player2InputFlags.moveUp) {
            this.player2.moveUp(deltaTime);
        }
        if (this.player2InputFlags.moveDown) {
            this.player2.moveDown(deltaTime);
        }
        if (this.player2InputFlags.moveLeft) {
            this.player2.moveLeft(deltaTime);
        }
        if (this.player2InputFlags.moveRight) {
            this.player2.moveRight(deltaTime);
        }
        if (this.player2InputFlags.shoot) {
            this.player2.shoot(deltaTime);
        }

        // Update players
        this.player1.update(deltaTime);
        this.player2.update(deltaTime);

        // Update systems
        this.bulletSystem.update(deltaTime);
        this.explosionSystem.update(deltaTime);
        this.collisionSystem.update();

        this.keyboardHandler.update();
        this.screenControlHandler.update();
        this.joypadHandler.update();
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
} 