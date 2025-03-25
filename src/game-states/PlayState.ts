import * as THREE from 'three';
import { GameState } from './GameState';
import { KeyboardHandler } from '../systems/input-handlers/KeyboardHandler';
import { ScreenControlHandler } from '../systems/input-handlers/ScreenControlHandler';
import { CPUInputHandler } from '../systems/input-handlers/CPUInputHandler';
import { GameStateManager } from './GameStateManager';
import { MenuState } from './MenuState';
import { AudioSystem } from '../systems/AudioSystem';
import { Player } from '../game-objects/Player';
import { PlaneModel } from '../assets/game-models/PlaneModel';
import { BulletSystem } from '../systems/BulletSystem';
import { ExplosionSystem } from '../systems/ExplosionSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { JoypadInputHandler } from '../systems/input-handlers/JoypadInputHandler';

export class PlayState implements GameState {
    private keyboardHandler!: KeyboardHandler;
    private screenControlHandler!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private cpuHandler!: CPUInputHandler;
    private gameStateManager!: GameStateManager;
    private backgroundTexture: THREE.CanvasTexture | null = null;
    private audioSystem: AudioSystem;
    private players: Player[] = [];
    private bulletSystem: BulletSystem;
    private explosionSystem: ExplosionSystem;
    private collisionSystem: CollisionSystem;

    // Input flags for each player
    private playerInputFlags: { [key: number]: {
        moveUp: boolean;
        moveDown: boolean;
        moveLeft: boolean;
        moveRight: boolean;
        shoot: boolean;
    }} = {};

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
        const player1 = new Player(planeModel1, 0);
        player1.setBulletSystem(this.bulletSystem);
        player1.getGroup().position.set(-5, 0, 0); // Position on the left
        scene.add(player1.getGroup());
        this.players.push(player1);
        this.playerInputFlags[0] = {
            moveUp: false,
            moveDown: false,
            moveLeft: false,
            moveRight: false,
            shoot: false
        };

        // Create player 2 with a red plane model
        const planeModel2 = new PlaneModel(0xff0000);
        const player2 = new Player(planeModel2, 1);
        player2.setBulletSystem(this.bulletSystem);
        player2.getGroup().position.set(5, 0, 0); // Position on the right
        scene.add(player2.getGroup());
        this.players.push(player2);
        this.playerInputFlags[1] = {
            moveUp: false,
            moveDown: false,
            moveLeft: false,
            moveRight: false,
            shoot: false
        };

        // Add players to collision system
        this.players.forEach(player => this.collisionSystem.addPlayer(player));

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
        this.cpuHandler = new CPUInputHandler();

        const inputHandler = (event: string, isPress: boolean) => {
            this.handleInput(event, isPress);
        };

        // Set up player 1 controls (keyboard and screen)
        this.joypadHandler.setEventHandler((event, isPress) => inputHandler(`player1a w_${event}`, isPress));
        this.keyboardHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));
        this.screenControlHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));

        
        // Set up player 2 controls (CPU)
        this.cpuHandler.setEventHandler((event, isPress) => inputHandler(`player2_${event}`, isPress));
        this.cpuHandler.setControlledPlayer(this.players[1]);
        this.cpuHandler.setOtherPlayers([this.players[0]]);
    }

    private handleInput(event: string, isPress: boolean): void {
        // Player 1 controls (keyboard/screen)
        if (event.startsWith('player1_')) {
            const action = event.replace('player1_', '');
            switch (action) {
                case 'up':
                    this.playerInputFlags[0].moveUp = isPress;
                    break;
                case 'down':
                    this.playerInputFlags[0].moveDown = isPress;
                    break;
                case 'left':
                    this.playerInputFlags[0].moveLeft = isPress;
                    break;
                case 'right':
                    this.playerInputFlags[0].moveRight = isPress;
                    break;
                case 'button1':
                    this.playerInputFlags[0].shoot = isPress;
                    break;
            }
        }
        // Player 2 controls (CPU)
        else if (event.startsWith('player2_')) {
            const action = event.replace('player2_', '');
            switch (action) {
                case 'up':
                    this.playerInputFlags[1].moveUp = isPress;
                    break;
                case 'down':
                    this.playerInputFlags[1].moveDown = isPress;
                    break;
                case 'left':
                    this.playerInputFlags[1].moveLeft = isPress;
                    break;
                case 'right':
                    this.playerInputFlags[1].moveRight = isPress;
                    break;
                case 'button1':
                    this.playerInputFlags[1].shoot = isPress;
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
        this.players.forEach(player => this.scene.remove(player.getGroup()));
    }

    public update(deltaTime: number): void {
        // Handle player movements
        this.players.forEach((player, index) => {
            const flags = this.playerInputFlags[index];
            if (flags.moveUp) player.moveUp(deltaTime);
            if (flags.moveDown) player.moveDown(deltaTime);
            if (flags.moveLeft) player.moveLeft(deltaTime);
            if (flags.moveRight) player.moveRight(deltaTime);
            if (flags.shoot) player.shoot(deltaTime);
            player.update(deltaTime);
        });

        // Update systems
        this.bulletSystem.update(deltaTime);
        this.explosionSystem.update(deltaTime);
        this.collisionSystem.update();

        this.keyboardHandler.update();
        this.screenControlHandler.update();
        this.cpuHandler.update(deltaTime);
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
} 