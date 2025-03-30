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
import { DebrisSystem } from '../systems/DebrisSystem';

export class PlayState implements GameState {
    private keyboardHandler!: KeyboardHandler;
    private screenControlHandler!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private cpuHandlers: CPUInputHandler[] = [];
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
    private countdownCameraDistance: number = 25; // Further zoomed out distance for countdown
    private playerBoundaryTimes: { [key: number]: number } = {}; // Track time each player has been outside boundary
    private lastWarningTimes: { [key: number]: number } = {}; // Track last warning time for each player
    private warningInterval: number = 1; // Time between warnings in seconds
    private winnerText: HTMLElement | null = null;
    private menuReturnText: HTMLElement | null = null;
    private gameOver: boolean = false;
    private winner: Player | null = null;
    private winnerCameraDistance: number = 3; // Closer distance to view winner
    private cameraTargetPosition: THREE.Vector3 | null = null;
    private debrisSystem: DebrisSystem;
    private countdownText: HTMLElement | null = null;
    private countdownState: 'countdown' | 'playing' = 'countdown';
    private countdownTime: number = 3;
    private countdownTimer: number = 0;
    private countdownInterval: number = 1; // Time between countdown numbers in seconds
    private cameraShakeIntensity: number = 0.5; // Maximum shake distance
    private cameraShakeDuration: number = 0.5; // Duration of shake in seconds
    private cameraShakeTime: number = 0; // Current time in shake animation
    private isCameraShaking: boolean = false;

    // Input flags for each player
    private playerInputFlags: { [key: number]: {
        moveUp: boolean;
        moveDown: boolean;
        moveLeft: boolean;
        moveRight: boolean;
        shoot: boolean;
        menu: boolean;
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
        this.debrisSystem = new DebrisSystem(this.scene);

        // Create countdown text element
        this.countdownText = document.createElement('div');
        this.countdownText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ffd700;
            font-size: 120px;
            font-weight: bold;
            text-align: center;
            display: none;
            z-index: 1000;
            text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
            font-family: Arial, sans-serif;
            animation: pulse 0.5s ease-in-out;
        `;
        document.body.appendChild(this.countdownText);

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.2); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);

        // Create winner text element
        this.winnerText = document.createElement('div');
        this.winnerText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ffd700;
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            display: none;
            z-index: 1000;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(this.winnerText);

        // Create menu return text element
        this.menuReturnText = document.createElement('div');
        this.menuReturnText.style.cssText = `
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            color: #ff0000;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            display: none;
            z-index: 1000;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            font-family: Arial, sans-serif;
        `;
        this.menuReturnText.textContent = 'Press B button to return to menu';
        document.body.appendChild(this.menuReturnText);

        // Create boundary sphere
        this.boundarySphere = new BoundarySphere();
        this.scene.add(this.boundarySphere.getGroup());

        // Define player configurations
        const playerConfigs = [
            { color: 0x4169e1, isCPU: false }, // Blue player 1 (human)
            { color: 0xff0000, isCPU: true },  // Red player 2 (CPU)
            { color: 0x800080, isCPU: true },   // Purple player 3 (CPU)
            // { color: 0x008000, isCPU: true },   // Green player 4 (CPU)
            // { color: 0xffff00, isCPU: true }   // Yellow player 5 (CPU)
        ];

        // Create and position all players
        playerConfigs.forEach((config, index) => {
            const planeModel = new GLBModel('assets/bi-plane2.glb');
            const player = new Player(planeModel, index, config);
            
            // Set up systems
            player.setBulletSystem(this.bulletSystem);
            player.setSmokeSystem(this.smokeSystem);
            player.setExplosionSystem(this.explosionSystem);
            
            // Set up death callback
            player.setOnDeathCallback(() => this.shakeCamera());
            
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
            const zRotation = angle - Math.PI;
            player.getGroup().rotation.z = zRotation;
            player.getModel().getGroup().rotation.x = zRotation;
            
            // Add to scene and track
            this.scene.add(player.getGroup());
            this.players.push(player);
            
            // Set up input flags
            this.playerInputFlags[index] = {
                moveUp: false,
                moveDown: false,
                moveLeft: false,
                moveRight: false,
                shoot: false,
                menu: false
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

        const inputHandler = (event: string, isPress: boolean) => {
            this.handleInput(event, isPress);
        };

        this.players.forEach((player, index) => {
            if (player.getConfig().isCPU) {
                const cpuHandler = new CPUInputHandler();
                cpuHandler.setEventHandler((event, isPress) => inputHandler(`player${index + 1}_${event}`, isPress));
                cpuHandler.setControlledPlayer(player);
                cpuHandler.setOtherPlayers(this.players.filter(p => p !== player));
                this.cpuHandlers.push(cpuHandler);
            } else {
                // Set up player 1 controls (keyboard and screen)
                this.joypadHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));
                this.keyboardHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));
                this.screenControlHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));
            }
        });

    }

    private handleInput(event: string, isPress: boolean): void {
        // Handle menu return during win state
        if (this.gameOver && event === 'player1_button2' && isPress) {
            const menuState = new MenuState(this.scene, this.camera, this.renderer);
            menuState.setGameStateManager(this.gameStateManager);
            this.gameStateManager.setState(menuState);
            return;
        }
        
        // Only handle other inputs if not in win state
        if (this.gameOver) return;

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
                case 'button2':
                    this.playerInputFlags[0].menu = isPress;
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
    }

    public setGameStateManager(manager: GameStateManager): void {
        this.gameStateManager = manager;
    }

    public async enter(): Promise<void> {
        this.setupBackground();

        // Start countdown
        this.countdownState = 'countdown';
        this.countdownTime = 3;
        this.countdownTimer = 0;
        
        // Set camera to countdown position
        this.camera.position.z = this.countdownCameraDistance;
        this.targetCameraZ = this.countdownCameraDistance;
        
        if (this.countdownText) {
            this.countdownText.style.display = 'block';
            this.countdownText.textContent = this.countdownTime.toString();
        }
        
        // Load game music but don't play it yet
        await this.musicSystem.loadTrack('game-music.json');
        
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

        // Clean up countdown text
        if (this.countdownText) {
            this.countdownText.remove();
            this.countdownText = null;
        }

        // Clean up
        this.starfieldSystem.cleanup();
        this.explosionSystem.cleanup();
        this.bulletSystem.clearBullets();
        this.debrisSystem.cleanup();
        this.smokeSystem.cleanup();

        // Remove UI elements
        if (this.winnerText) {
            this.winnerText.remove();
            this.winnerText = null;
        }
        if (this.menuReturnText) {
            this.menuReturnText.remove();
            this.menuReturnText = null;
        }
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

    private checkForWinner(): void {
        if (this.gameOver) return;

        const alivePlayers = this.players.filter(player => !player.isDead());
        if (alivePlayers.length === 1) {
            this.winner = alivePlayers[0];
            this.gameOver = true;
            
            // Display winner text
            if (this.winnerText) {
                this.winnerText.textContent = `Player ${this.winner.getPlayerNum() + 1} is the winner!`;
                this.winnerText.style.display = 'block';
            }

            // Display menu return text
            if (this.menuReturnText) {
                this.menuReturnText.style.display = 'block';
            }
            
            // Stop all movement
            // this.playerInputFlags = {};
            this.players.forEach(player => {
                if (player !== this.winner) {
                    player.setGameOver();
                }
            });
        }
    }

    private shakeCamera(): void {
        this.isCameraShaking = true;
        this.cameraShakeTime = 0;
    }

    private updateCameraShake(deltaTime: number): void {
        if (!this.isCameraShaking) return;

        this.cameraShakeTime += deltaTime;
        if (this.cameraShakeTime >= this.cameraShakeDuration) {
            this.isCameraShaking = false;
            return;
        }

        // Calculate shake intensity (decreases over time)
        const progress = this.cameraShakeTime / this.cameraShakeDuration;
        const currentIntensity = this.cameraShakeIntensity * (1 - progress);

        // Apply random offset to camera position
        this.camera.position.x += (Math.random() - 0.5) * currentIntensity;
        this.camera.position.y += (Math.random() - 0.5) * currentIntensity;
        this.camera.position.z += (Math.random() - 0.5) * currentIntensity;
    }

    public update(deltaTime: number): void {
        if (this.countdownState === 'countdown') {
            this.countdownTimer += deltaTime;
            
            if (this.countdownTimer >= this.countdownInterval) {
                this.countdownTimer = 0;
                this.countdownTime--;
                
                if (this.countdownText) {
                    this.countdownText.textContent = this.countdownTime.toString();
                    // Play countdown sound
                    this.audioSystem.playWarning();
                }
                
                if (this.countdownTime <= 0) {
                    // Start the game
                    this.countdownState = 'playing';
                    if (this.countdownText) {
                        this.countdownText.textContent = 'GO!';
                        this.audioSystem.playDeathExplosion();
                        setTimeout(() => {
                            if (this.countdownText) {
                                this.countdownText.style.display = 'none';
                            }
                        }, 500);
                    }
                    // Start the music
                    this.musicSystem.play();
                    // Calculate and set the target camera distance for gameplay
                    this.targetCameraZ = this.calculateRequiredCameraDistance();
                }
            }
            return;
        }

        if (this.gameOver) {
            // When game is over, smoothly move camera to winner's position and zoom in
            if (this.winner) {
                const winnerPosition = this.winner.getPosition();
                
                // Set target position if not set yet
                if (!this.cameraTargetPosition) {
                    this.cameraTargetPosition = winnerPosition.clone();
                }
                
                // Smoothly move camera to winner's position
                this.camera.position.x = THREE.MathUtils.lerp(
                    this.camera.position.x,
                    this.cameraTargetPosition.x,
                    deltaTime * this.cameraZoomSpeed
                );
                this.camera.position.y = THREE.MathUtils.lerp(
                    this.camera.position.y,
                    this.cameraTargetPosition.y,
                    deltaTime * this.cameraZoomSpeed
                );
                
                // Smoothly zoom in
                const currentZ = this.camera.position.z;
                const newZ = THREE.MathUtils.lerp(currentZ, this.winnerCameraDistance, deltaTime * this.cameraZoomSpeed);
                this.camera.position.z = newZ;

                const flags = this.playerInputFlags[0];
                if (flags.menu) {
                    const menuState = new MenuState(this.scene, this.camera, this.renderer);
                    menuState.setGameStateManager(this.gameStateManager);
                    this.gameStateManager.setState(menuState);
                }
            }
            return;
        }

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

        // Update camera shake
        this.updateCameraShake(deltaTime);

        // Check for winner
        this.checkForWinner();

        this.joypadHandler.update();
        this.keyboardHandler.update();
        this.screenControlHandler.update();
        this.cpuHandlers.forEach(handler => handler.update(deltaTime));
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
} 