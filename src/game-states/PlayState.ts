import * as THREE from 'three';
import { GameState } from './GameState';
import { KeyboardHandler } from '../systems/input-handlers/KeyboardHandler';
import { ScreenControlHandler } from '../systems/input-handlers/ScreenControlHandler';
import { CPUInputHandler } from '../systems/input-handlers/CPUInputHandler';
import { GameStateManager } from './GameStateManager';
import { MenuState } from './MenuState';
import { AudioSystem } from '../systems/AudioSystem';
import { Player } from '../game-objects/Player';
import { GLBModel } from '../assets/game-models/GLBModel';
import { BulletSystem } from '../systems/BulletSystem';
import { ExplosionSystem } from '../systems/ExplosionSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { JoypadInputHandler } from '../systems/input-handlers/JoypadInputHandler';
import { SmokeSystem } from '../systems/SmokeSystem';
import { MusicSystem } from '../systems/MusicSystem';
import { BoundarySphere } from '../game-objects/BoundarySphere';
import { StarfieldSystem } from '../systems/StarfieldSystem';

export class PlayState implements GameState {
    private keyboardHandler!: KeyboardHandler;
    private screenControlHandler!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private cpuHandler!: CPUInputHandler;
    private cpuHandler2!: CPUInputHandler;
    private gameStateManager!: GameStateManager;
    private backgroundTexture: THREE.CanvasTexture | null = null;
    private audioSystem: AudioSystem;
    private musicSystem: MusicSystem;
    private players: Player[] = [];
    private bulletSystem: BulletSystem;
    private explosionSystem: ExplosionSystem;
    private collisionSystem: CollisionSystem;
    private smokeSystem: SmokeSystem;
    private starfieldSystem: StarfieldSystem;
    private boundarySphere: BoundarySphere;
    private targetCameraZ: number = 10;
    private cameraZoomSpeed: number = 2;
    private boundaryRadius: number = 15; // Radius of the boundary sphere
    private playerBoundaryTimes: { [key: number]: number } = {}; // Track time each player has been outside boundary
    private lastWarningTimes: { [key: number]: number } = {}; // Track last warning time for each player
    private warningInterval: number = 1; // Time between warnings in seconds

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
        this.musicSystem = new MusicSystem(this.audioSystem);
        this.bulletSystem = new BulletSystem(this.scene, this.audioSystem);
        this.explosionSystem = new ExplosionSystem(this.scene, this.audioSystem);
        this.collisionSystem = new CollisionSystem(this.bulletSystem, this.explosionSystem);
        this.smokeSystem = new SmokeSystem(this.scene);
        this.starfieldSystem = new StarfieldSystem(this.scene, this.boundaryRadius);

        // Create boundary sphere
        this.boundarySphere = new BoundarySphere();
        this.scene.add(this.boundarySphere.getGroup());

        // Define player configurations
        const playerConfigs = [
            { color: 0x4169e1, isCPU: false }, // Blue player 1 (human)
            { color: 0xff0000, isCPU: true },  // Red player 2 (CPU)
            { color: 0x800080, isCPU: true }   // Purple player 3 (CPU)
        ];

        // Create and position all players
        playerConfigs.forEach((config, index) => {
            const planeModel = new GLBModel('assets/bi-plane.glb', config.color);
            const player = new Player(planeModel, index);
            
            // Set up systems
            player.setBulletSystem(this.bulletSystem);
            player.setSmokeSystem(this.smokeSystem);
            player.setExplosionSystem(this.explosionSystem);
            
            // Calculate position around the boundary
            const angle = (index * 2 * Math.PI) / playerConfigs.length;
            const position = new THREE.Vector3(
                Math.cos(angle) * this.boundaryRadius,
                Math.sin(angle) * this.boundaryRadius,
                0
            );
            
            // Set position and rotation
            player.getGroup().position.copy(position);
            // The plane model is rotated 90 degrees by default, so we need to adjust
            // the rotation to face inward. The angle + Math.PI points outward, so we
            // subtract Math.PI to point inward
            player.getGroup().rotation.z = angle - Math.PI;
            
            // Add to scene and track
            this.scene.add(player.getGroup());
            this.players.push(player);
            
            // Set up input flags
            this.playerInputFlags[index] = {
                moveUp: false,
                moveDown: false,
                moveLeft: false,
                moveRight: false,
                shoot: false
            };
        });

        // Add players to collision system
        this.players.forEach(player => this.collisionSystem.addPlayer(player));

        // Position camera
        this.camera.position.z = 10;
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
        this.joypadHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));
        this.keyboardHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));
        this.screenControlHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));

        
        // Set up player 2 controls (CPU)
        this.cpuHandler.setEventHandler((event, isPress) => inputHandler(`player2_${event}`, isPress));
        this.cpuHandler.setControlledPlayer(this.players[1]);
        this.cpuHandler.setOtherPlayers([this.players[0], this.players[2]]);

        // Set up player 3 controls (CPU)
        this.cpuHandler2 = new CPUInputHandler();
        this.cpuHandler2.setEventHandler((event, isPress) => inputHandler(`player3_${event}`, isPress));
        this.cpuHandler2.setControlledPlayer(this.players[2]);
        this.cpuHandler2.setOtherPlayers([this.players[0], this.players[1], this.players[1]]);
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
        // Player 3 controls (CPU)
        else if (event.startsWith('player3_')) {
            const action = event.replace('player3_', '');
            switch (action) {
                case 'up':
                    this.playerInputFlags[2].moveUp = isPress;
                    break;
                case 'down':
                    this.playerInputFlags[2].moveDown = isPress;
                    break;
                case 'left':
                    this.playerInputFlags[2].moveLeft = isPress;
                    break;
                case 'right':
                    this.playerInputFlags[2].moveRight = isPress;
                    break;
                case 'button1':
                    this.playerInputFlags[2].shoot = isPress;
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

    public async enter(): Promise<void> {
        this.setupBackground();

        // Load and play game music
        await this.musicSystem.loadTrack('game-music.json');
        this.musicSystem.play();
        
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
        this.musicSystem.stop();
        this.musicSystem.cleanup();
        this.audioSystem.cleanup();

        // Clean up background texture
        if (this.backgroundTexture) {
            this.backgroundTexture.dispose();
            this.backgroundTexture = null;
        }
        this.scene.background = null;

        // Remove players
        this.players.forEach(player => this.scene.remove(player.getGroup()));
        
        // Remove boundary sphere
        this.scene.remove(this.boundarySphere.getGroup());

        // Clean up starfield
        this.starfieldSystem.cleanup();
    }

    private calculateRequiredCameraDistance(): number {
        // Calculate the center of the playfield
        const center = new THREE.Vector3(0, 0, 0);
        
        // Find the furthest distance from center to any player
        let maxDistance = 0;
        this.players.filter(player => !player.isDead()).forEach(player => {
            const position = player.getGroup().position;
            const distance = position.distanceTo(center);
            maxDistance = Math.max(maxDistance, distance);
        });

        // Calculate the required camera distance based on the field of view
        const fov = this.camera.fov * (Math.PI / 180);
        const aspectRatio = this.renderer.getSize(new THREE.Vector2()).x / this.renderer.getSize(new THREE.Vector2()).y;
        
        // Add some padding to ensure players aren't too close to the edges
        const padding = 3;
        const requiredDistance = (maxDistance + padding) / Math.tan(fov / 2);

        // Return the required distance
        return requiredDistance;
    }

    public update(deltaTime: number): void {
        // Handle player movements
        this.players.forEach((player, index) => {
            if (player.isDead()) {
                return;
            }

            const flags = this.playerInputFlags[index];
            if (flags.moveUp) player.moveUp(deltaTime);
            if (flags.moveDown) player.moveDown(deltaTime);
            if (flags.moveLeft) player.moveLeft(deltaTime);
            if (flags.moveRight) player.moveRight(deltaTime);
            if (flags.shoot) player.shoot(deltaTime);
            player.update(deltaTime);

            // Check if player is outside boundary
            const playerPosition = player.getPosition();
            const distanceFromCenter = playerPosition.length();
            
            if (distanceFromCenter > this.boundaryRadius) {
                // Player is outside boundary
                player.setOutsideBoundary(true);
                
                if (!this.playerBoundaryTimes[index]) {
                    this.playerBoundaryTimes[index] = 0;
                }
                this.playerBoundaryTimes[index] += deltaTime;

                // Play warning sound if enough time has passed since last warning
                const currentTime = Date.now();
                if (!this.lastWarningTimes[index] || currentTime - this.lastWarningTimes[index] >= this.warningInterval * 1000) {
                    this.audioSystem.playWarning();
                    this.lastWarningTimes[index] = currentTime;
                }

                // Kill player if they've been outside for 3 seconds
                if (this.playerBoundaryTimes[index] >= 3) {
                    player.takeDamage();
                    player.takeDamage();
                    player.takeDamage(); // Call twice to reduce energy to 0
                    this.playerBoundaryTimes[index] = 0; // Reset the timer
                    this.lastWarningTimes[index] = 0; // Reset the warning timer
                }
            } else {
                // Player is inside boundary
                player.setOutsideBoundary(false);
                this.playerBoundaryTimes[index] = 0;
                this.lastWarningTimes[index] = 0;
            }
        });

        // Update camera position
        const requiredDistance = this.calculateRequiredCameraDistance();
        this.targetCameraZ = requiredDistance;
        
        // Smoothly interpolate camera position
        const currentZ = this.camera.position.z;
        const newZ = THREE.MathUtils.lerp(currentZ, this.targetCameraZ, deltaTime * this.cameraZoomSpeed);
        this.camera.position.z = newZ;

        // Update systems
        this.bulletSystem.update(deltaTime);
        this.explosionSystem.update(deltaTime);
        this.collisionSystem.update();
        this.smokeSystem.update(deltaTime);
        this.starfieldSystem.update(deltaTime);

        this.keyboardHandler.update();
        this.screenControlHandler.update();
        this.cpuHandler.update(deltaTime);
        this.cpuHandler2.update(deltaTime);
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
} 