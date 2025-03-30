import * as THREE from 'three';
import { GameState } from './GameState';
import { KeyboardHandler } from '../systems/input-handlers/KeyboardHandler';
import { ScreenControlHandler } from '../systems/input-handlers/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/input-handlers/JoypadInputHandler';
import { GameStateManager } from './GameStateManager';
import { PlayState } from './PlayState';
import { Player } from '../game-objects/Player';
import { GLBModel } from '../assets/game-models/GLBModel';
import { StarfieldSystem } from '../systems/StarfieldSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { MusicSystem } from '../systems/MusicSystem';

export class PortalState implements GameState {
    private keyboardHandler!: KeyboardHandler;
    private screenControlHandler!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private gameStateManager!: GameStateManager;
    private player: Player;
    private leftPortal: THREE.Mesh;
    private rightPortal: THREE.Mesh;
    private moveSpeed: number = 5; // Units per second
    private portalRadius: number = 2;
    private portalColor: number = 0x00ff00; // Bright green
    private backgroundTexture: THREE.CanvasTexture | null = null;
    private ground: THREE.Mesh;
    private portalStarfields: { left: StarfieldSystem; right: StarfieldSystem };
    private portalLabels: { left: HTMLElement; right: HTMLElement };
    private cityscape: THREE.Group;
    private flyingPlanes: THREE.Mesh[] = [];
    private audioSystem: AudioSystem;
    private musicSystem: MusicSystem;
    private titleContainer: HTMLDivElement;
    private playerInputFlags: { [key: number]: {
        left: boolean;
        right: boolean; 
    }} = [{left: false, right: false}];
    private buildings: Array<{
        group: THREE.Group;
        baseHeight: number;
        targetHeight: number;
        animationSpeed: number;
        phase: number;
        currentTargetScale: number;
        lastBeat: number;
    }> = [];

    constructor(
        private scene: THREE.Scene,
        private camera: THREE.PerspectiveCamera,
        private renderer: THREE.WebGLRenderer
    ) {
        this.audioSystem = new AudioSystem();
        this.musicSystem = new MusicSystem(this.audioSystem);
        
        // Create title container
        this.titleContainer = document.createElement('div');
        this.titleContainer.style.cssText = `
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(this.titleContainer);
        
        // Create player
        const planeModel = new GLBModel('assets/bi-plane2.glb');
        this.player = new Player(planeModel, 0, { color: 0x4169e1, isCPU: false });
        
        // Position player at bottom middle of screen
        this.player.getGroup().position.set(0, -8, 0);
        this.player.getGroup().rotation.z = 0; // Face upward
        this.scene.add(this.player.getGroup());

        // Create wider ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080, // Grey color
            side: THREE.DoubleSide
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2; // Lay flat
        this.ground.position.y = -8; // Position at player's level
        this.scene.add(this.ground);

        // Create cityscape
        this.cityscape = new THREE.Group();
        this.createCityscape();
        this.scene.add(this.cityscape);

        // Create flying planes
        this.createFlyingPlanes();

        // Create portals with more visible materials
        const portalGeometry = new THREE.CircleGeometry(this.portalRadius, 32);
        const portalMaterial = new THREE.MeshPhongMaterial({
            color: this.portalColor,
            emissive: this.portalColor,
            emissiveIntensity: 1.0, // Increased from 0.5 to 1.0
            shininess: 100
        });

        // Left portal
        this.leftPortal = new THREE.Mesh(portalGeometry, portalMaterial);
        this.leftPortal.position.set(-10, -7.9, 0); // Slightly above ground
        this.leftPortal.rotation.x = -Math.PI / 2; // Face upward
        this.scene.add(this.leftPortal);

        // Right portal
        this.rightPortal = new THREE.Mesh(portalGeometry, portalMaterial);
        this.rightPortal.position.set(10, -7.9, 0); // Slightly above ground
        this.rightPortal.rotation.x = -Math.PI / 2; // Face upward
        this.scene.add(this.rightPortal);

        // Add portal glow effect
        const glowGeometry = new THREE.CircleGeometry(this.portalRadius * 1.5, 32);
        const glowMaterial = new THREE.MeshPhongMaterial({
            color: this.portalColor,
            emissive: this.portalColor,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.5
        });

        // Left portal glow
        const leftGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        leftGlow.position.copy(this.leftPortal.position);
        this.scene.add(leftGlow);

        // Right portal glow
        const rightGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        rightGlow.position.copy(this.rightPortal.position);
        this.scene.add(rightGlow);

        // Create portal labels
        this.portalLabels = {
            left: this.createPortalLabel('Vibeverse Portal', -10),
            right: this.createPortalLabel('Start Game', 10)
        };

        // Initialize localized starfield systems for each portal
        this.portalStarfields = {
            left: new StarfieldSystem(this.scene, 2.5, this.leftPortal.position, 500, 4),
            right: new StarfieldSystem(this.scene, 2.5, this.rightPortal.position, 500, 4)
        };

        // Position camera
        this.camera.position.z = 15;
    }

    private createCityscape(): void {
        const buildingCount = 20;
        const buildingSpacing = 10;
        const buildingWidth = 8;
        const buildingHeight = 15;
        const buildingDepth = 8;

        // Create front row of buildings
        for (let i = 0; i < buildingCount; i++) {
            const building = new THREE.Group();
            
            // Main building body
            const buildingBody = new THREE.Mesh(
                new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth),
                new THREE.MeshPhongMaterial({
                    color: 0x2c3e50,
                    emissive: 0x1a252f,
                    shininess: 30
                })
            );
            building.add(buildingBody);

            // Randomize building height and position
            const height = buildingHeight * (0.5 + Math.random() * 0.5);
            building.scale.y = height / buildingHeight;

            // Add windows
            const windowRows = Math.floor((height / buildingHeight) * 5); // 5 rows for full height
            const windowCols = 3; // 3 windows per row
            const windowWidth = 1;
            const windowHeight = 1.5;
            const windowDepth = 0.1;
            const windowSpacing = 2;
            const windowMaterial = new THREE.MeshPhongMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.5,
                shininess: 100
            });

            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    const window = new THREE.Mesh(
                        new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
                        windowMaterial
                    );
                    
                    // Position windows on both front and back faces
                    const xOffset = (col - 1) * windowSpacing;
                    const yOffset = (row - windowRows/2) * windowSpacing;
                    
                    // Front face windows
                    window.position.set(xOffset, yOffset, buildingDepth/2 + windowDepth/2);
                    building.add(window.clone());
                    
                    // Back face windows
                    window.position.z = -buildingDepth/2 - windowDepth/2;
                    building.add(window);
                }
            }

            building.position.set(
                (i - buildingCount / 2) * buildingSpacing,
                height / 2 - 8,
                -20
            );

            this.cityscape.add(building);
            
            // Add building to animation array with beat-based timing
            this.buildings.push({
                group: building,
                baseHeight: height,
                targetHeight: height,
                animationSpeed: 1 + (i % 2), // Alternate between 1x and 2x speed for front buildings
                phase: 0,
                currentTargetScale: 1.0, // Initial scale
                lastBeat: -1 // Initialize to -1 to ensure first beat generates a new scale
            });
        }

        // Create back row of buildings (further away and slightly smaller)
        for (let i = 0; i < buildingCount; i++) {
            const building = new THREE.Group();
            
            // Main building body
            const buildingBody = new THREE.Mesh(
                new THREE.BoxGeometry(buildingWidth * 0.8, buildingHeight * 0.8, buildingDepth * 0.8),
                new THREE.MeshPhongMaterial({
                    color: 0x1a252f,
                    emissive: 0x0f1419,
                    shininess: 30
                })
            );
            building.add(buildingBody);

            // Randomize building height and position
            const height = buildingHeight * 0.8 * (0.5 + Math.random() * 0.5);
            building.scale.y = height / (buildingHeight * 0.8);

            // Add windows
            const windowRows = Math.floor((height / buildingHeight) * 4); // 4 rows for back buildings
            const windowCols = 2; // 2 windows per row for back buildings
            const windowWidth = 0.8;
            const windowHeight = 1.2;
            const windowDepth = 0.1;
            const windowSpacing = 1.6;
            const windowMaterial = new THREE.MeshPhongMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.3, // Less bright for back buildings
                shininess: 100
            });

            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    const window = new THREE.Mesh(
                        new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
                        windowMaterial
                    );
                    
                    // Position windows on both front and back faces
                    const xOffset = (col - 0.5) * windowSpacing;
                    const yOffset = (row - windowRows/2) * windowSpacing;
                    
                    // Front face windows
                    window.position.set(xOffset, yOffset, buildingDepth * 0.8/2 + windowDepth/2);
                    building.add(window.clone());
                    
                    // Back face windows
                    window.position.z = -buildingDepth * 0.8/2 - windowDepth/2;
                    building.add(window);
                }
            }

            building.position.set(
                (i - buildingCount / 2) * buildingSpacing,
                height / 2 - 8,
                -40
            );

            this.cityscape.add(building);
            
            // Add building to animation array with beat-based timing
            this.buildings.push({
                group: building,
                baseHeight: height,
                targetHeight: height,
                animationSpeed: 0.5 + (i % 2), // Alternate between 0.5x and 1x speed for back buildings
                phase: 0,
                currentTargetScale: 1.0, // Initial scale
                lastBeat: -1 // Initialize to -1 to ensure first beat generates a new scale
            });
        }
    }

    private createFlyingPlanes(): void {
        const planeCount = 5;
        const planeGeometry = new THREE.BoxGeometry(2, 0.5, 1);
        const planeMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x000000,
            shininess: 100
        });

        for (let i = 0; i < planeCount; i++) {
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            
            // Randomize position and rotation
            plane.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 50
            );
            plane.rotation.x = Math.PI / 4;
            
            this.flyingPlanes.push(plane);
            this.scene.add(plane);
        }
    }

    private createPortalLabel(text: string, xPosition: number): HTMLElement {
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            z-index: 1000;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            font-family: Arial, sans-serif;
            pointer-events: none;
        `;
        label.textContent = text;
        document.body.appendChild(label);
        return label;
    }

    private updatePortalLabels(): void {
        // Convert 3D positions to screen coordinates
        const leftPortalScreen = this.leftPortal.position.clone();
        const rightPortalScreen = this.rightPortal.position.clone();

        leftPortalScreen.project(this.camera);
        rightPortalScreen.project(this.camera);

        // Update left portal label position
        this.portalLabels.left.style.left = `${(leftPortalScreen.x + 1) * window.innerWidth / 2}px`;
        this.portalLabels.left.style.top = `${(-leftPortalScreen.y + 1) * window.innerHeight / 2}px`;

        // Update right portal label position
        this.portalLabels.right.style.left = `${(rightPortalScreen.x + 1) * window.innerWidth / 2}px`;
        this.portalLabels.right.style.top = `${(-rightPortalScreen.y + 1) * window.innerHeight / 2}px`;
    }

    private setupBackground(): void {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 2;
        canvas.height = 512;
        if (context) {
            const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#ff6b6b');  // Warm orange-red
            gradient.addColorStop(0.5, '#ffd93d');  // Yellow
            gradient.addColorStop(1, '#4a90e2');  // Blue
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

        // Set up controls for player
        this.joypadHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));
        this.keyboardHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));
        this.screenControlHandler.setEventHandler((event, isPress) => inputHandler(`player1_${event}`, isPress));
    }

    private handleInput(event: string, isPress: boolean): void {
        if (event.startsWith('player1_')) {
            const action = event.replace('player1_', '');
            switch (action) {
                case 'left':
                    this.playerInputFlags[0].left = isPress;
                    this.playerInputFlags[0].right = false;
                    break;
                case 'right':
                    this.playerInputFlags[0].left = false;
                    this.playerInputFlags[0].right = isPress;
                    break;
            }
        }
    }

    public setGameStateManager(manager: GameStateManager): void {
        this.gameStateManager = manager;
    }

    public async enter(): Promise<void> {
        this.setupBackground();
        // Show controls only on mobile devices
        if (this.isMobileDevice()) {
            this.screenControlHandler.showControls();
        } else {
            this.screenControlHandler.hideControls();
        }
        await this.musicSystem.loadTrack('menu-music.json');
        this.musicSystem.play();

        // Update title display
        this.titleContainer.innerHTML = `
            <style>
                @keyframes gentleRotate {
                    0% { transform: rotate(-2deg); }
                    50% { transform: rotate(2deg); }
                    100% { transform: rotate(-2deg); }
                }
                .title {
                    font-size: 12vh;
                    font-weight: bold;
                    margin-top: 8vh;
                    margin-bottom:0vh;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                    animation: gentleRotate 3s ease-in-out infinite;
                    display: inline-block;
                }
                .instructions {
                    font-size: 2vh;
                    color: #ffffff;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }
            </style>
            <div class="title">Bi-Plane Panic</div>
            <div class="instructions">WASD to move.</br>Space = Button A</br>Enter = Button B</div>
            <div class="instructions" style="color: #ff0000">Move your plane left or right to choose your portal.</div>
        `;
    }

    private isMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    public exit(): void {
        // Remove player
        this.scene.remove(this.player.getGroup());
        
        // Remove portals and their glow effects
        this.scene.remove(this.leftPortal);
        this.scene.remove(this.rightPortal);
        
        // Remove ground
        this.scene.remove(this.ground);

        // Remove cityscape
        this.scene.remove(this.cityscape);

        // Remove flying planes
        this.flyingPlanes.forEach(plane => this.scene.remove(plane));
        this.flyingPlanes = [];

        // Remove portal labels
        this.portalLabels.left.remove();
        this.portalLabels.right.remove();

        // Remove title container
        this.titleContainer.remove();

        // Clean up portal starfields
        this.portalStarfields.left.cleanup();
        this.portalStarfields.right.cleanup();

        // Clean up background texture
        if (this.backgroundTexture) {
            this.backgroundTexture.dispose();
            this.backgroundTexture = null;
        }
        this.scene.background = null;

        // Clean up music system
        this.musicSystem.stop();
        this.musicSystem.cleanup();
        this.audioSystem.cleanup();
    }

    public update(deltaTime: number): void {
        // Update flying planes
        this.flyingPlanes.forEach(plane => {
            plane.position.x += deltaTime * 2;
            if (plane.position.x > 50) {
                plane.position.x = -50;
            }
        });

        // Update building heights
        this.updateBuildingHeights(deltaTime);

        // Player movement
        if (this.playerInputFlags[0].left) {
            this.player.getGroup().position.x -= this.moveSpeed * deltaTime;
            this.player.getGroup().rotation.y = Math.PI;
        } else if (this.playerInputFlags[0].right) {
            this.player.getGroup().position.x += this.moveSpeed * deltaTime;
            this.player.getGroup().rotation.y = Math.PI * 2;
        }

        // Check for portal collisions
        const playerPosition = this.player.getPosition();
        const leftPortalDistance = playerPosition.distanceTo(this.leftPortal.position);
        const rightPortalDistance = playerPosition.distanceTo(this.rightPortal.position);

        if (leftPortalDistance < this.portalRadius) {
            // Redirect to Google
            window.location.href = 'http://portal.pieter.com';
        } else if (rightPortalDistance < this.portalRadius) {
            // Transition to PlayState
            const playState = new PlayState(this.scene, this.camera, this.renderer);
            playState.setGameStateManager(this.gameStateManager);
            this.gameStateManager.setState(playState);
        }

        // Update portal starfields
        this.portalStarfields.left.update(deltaTime);
        this.portalStarfields.right.update(deltaTime);

        // Update portal label positions
        this.updatePortalLabels();

        // Update input handlers
        this.joypadHandler.update();
        this.keyboardHandler.update();
        this.screenControlHandler.update();
    }

    private updateBuildingHeights(deltaTime: number): void {
        const currentBeat = this.musicSystem.getCurrentBeat();
        
        this.buildings.forEach((building, index) => {
            if (index % 2 === 0) {
                return;
            }
            
            // Only generate new random scale when beat changes
            if (currentBeat !== building.lastBeat) {
                building.currentTargetScale = (currentBeat % 2 === 0) ? 1 : 1.2 - (Math.random() * 0.6); // Random scale between 1.2 and 1.8
                building.lastBeat = currentBeat;
            }
            
            // Apply scale from the base
            building.group.scale.y = building.currentTargetScale;
            
            // Update position to maintain base alignment
            const heightDiff = (building.baseHeight * building.currentTargetScale - building.baseHeight) / 2;
            building.group.position.y = (building.baseHeight / 2 - 8) + heightDiff;
        });
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
} 