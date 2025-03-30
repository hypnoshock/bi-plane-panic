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
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';

export class PortalState implements GameState {
    private keyboardHandler!: KeyboardHandler;
    private screenControlHandler!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private gameStateManager!: GameStateManager;
    private player: Player;
    private leftPortal: THREE.Group;
    private runwayMarking: THREE.Group;
    private moveSpeed: number = 5; // Units per second
    private portalRadius: number = 2;
    private portalColor: number = 0x00ff00; // Bright green
    private backgroundTexture: THREE.CanvasTexture | null = null;
    private ground: THREE.Mesh;
    private portalStarfields: { left: StarfieldSystem };
    private portalLabels: { left: THREE.Sprite | null };
    private cityscape: THREE.Group;
    private flyingPlanes: GLBModel[] = [];
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
    private startText: THREE.Mesh | null = null;

    constructor(
        private scene: THREE.Scene,
        private camera: THREE.PerspectiveCamera,
        private renderer: THREE.WebGLRenderer,
        private audioSystem: AudioSystem
    ) {
        this.audioSystem = audioSystem;
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
        this.player = new Player(planeModel, 0, { color: 0xff0000, isCPU: false });
        
        // Position player at bottom middle of screen
        this.player.getGroup().position.set(0, -7, 0);
        this.player.getGroup().rotation.z = 0; // Face upward
        this.player.getGroup().scale.set(2, 2, 2);
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
        const portalGeometry = new THREE.TorusGeometry(this.portalRadius, 0.3, 16, 32);
        const portalMaterial = new THREE.MeshPhongMaterial({
            color: this.portalColor,
            emissive: this.portalColor,
            emissiveIntensity: 1.0,
            shininess: 100,
        });

        // Left portal
        this.leftPortal = new THREE.Group();
        const leftPortalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
        this.leftPortal.add(leftPortalMesh);
        this.leftPortal.position.set(-10, -7.9, 0);
        this.leftPortal.rotation.set( 0, -Math.PI / 2, 0);
        this.scene.add(this.leftPortal);

        // Create runway centerline marking
        this.runwayMarking = new THREE.Group();
        
        // Main centerline
        const centerlineGeometry = new THREE.PlaneGeometry(0.5, 10);
        const centerlineMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5,
            shininess: 100,
        });
        const centerline = new THREE.Mesh(centerlineGeometry, centerlineMaterial);
        centerline.rotation.x = -Math.PI / 2;
        centerline.position.y = -7.9;
        centerline.position.z = -1;
        this.runwayMarking.add(centerline);

        // Dashed lines
        const dashGeometry = new THREE.PlaneGeometry(0.3, 1);
        const dashMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5,
            shininess: 100,
        });

        for (let i = 0; i < 3; i++) {
            const dash = new THREE.Mesh(dashGeometry, dashMaterial);
            dash.rotation.x = -Math.PI / 2;
            dash.position.y = -7.9;
            dash.position.z = (i - 1) * 1.5;
            this.runwayMarking.add(dash);
        }

        // Add horizontal lines to the right
        const horizontalLineGeometry = new THREE.PlaneGeometry(4, 0.3); // Wide but thin rectangle
        const horizontalLineMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5,
            shininess: 100,
        });

        // First group of 6 lines
        for (let i = 0; i < 6; i++) {
            const line = new THREE.Mesh(horizontalLineGeometry, horizontalLineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.y = -7.9;
            line.position.x = 3; // Start just after the runway marking
            line.position.z = (i - 2.5) * 0.8 - 4; // Space lines evenly
            this.runwayMarking.add(line);
        }

        // Second group of 6 lines (with gap)
        for (let i = 0; i < 6; i++) {
            const line = new THREE.Mesh(horizontalLineGeometry, horizontalLineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.y = -7.9;
            line.position.x = 3;
            line.position.z = (i - 2.5) * 0.8 + 1.5; // Space lines evenly with gap
            this.runwayMarking.add(line);
        }

        this.runwayMarking.position.set(10, 0, 0);
        this.scene.add(this.runwayMarking);

        // Create START text
        const fontLoader = new FontLoader();
        fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font: Font) => {
            const textGeometry = new TextGeometry('START', {
                font: font,
                size: 1,
                depth: 0.1,
                curveSegments: 2,
                bevelEnabled: false
            });
            
            const textMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.5,
                shininess: 100
            });
            
            this.startText = new THREE.Mesh(textGeometry, textMaterial);
            
            // Center the text
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
            this.startText.position.set(9, -7.9, 2); // Position to the right of the centerline
            
            // Rotate to lay flat on the ground
            this.startText.rotation.x = -Math.PI / 2;
            this.startText.rotation.z = Math.PI / 2;
            
            this.scene.add(this.startText);
        });

        // Add enhanced portal glow effects
        // Inner glow
        const innerGlowGeometry = new THREE.TorusGeometry(this.portalRadius * 0.9, 0.4, 16, 32);
        const innerGlowMaterial = new THREE.MeshPhongMaterial({
            color: this.portalColor,
            emissive: this.portalColor,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.6
        });

        // Outer glow
        const outerGlowGeometry = new THREE.TorusGeometry(this.portalRadius * 1.2, 0.2, 16, 32);
        const outerGlowMaterial = new THREE.MeshPhongMaterial({
            color: this.portalColor,
            emissive: this.portalColor,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.3
        });

        // Particle ring effect
        const particleRingGeometry = new THREE.RingGeometry(
            this.portalRadius * 0.8,
            this.portalRadius * 1.4,
            32
        );
        const particleRingMaterial = new THREE.PointsMaterial({
            color: this.portalColor,
            size: 0.1,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        // Add glows to left portal
        const leftInnerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        const leftOuterGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        const leftParticleRing = new THREE.Points(particleRingGeometry, particleRingMaterial);
        leftParticleRing.rotation.x = Math.PI / 2;
        this.leftPortal.add(leftInnerGlow);
        this.leftPortal.add(leftOuterGlow);
        this.leftPortal.add(leftParticleRing);

        // Create portal labels
        this.portalLabels = {
            left: this.createPortalLabel('Vibeverse Portal')
        };

        // Add portal label to scene
        if (this.portalLabels.left) {
            this.scene.add(this.portalLabels.left);
        }

        // Initialize localized starfield system for portal
        this.portalStarfields = {
            left: new StarfieldSystem(this.scene, 2.5, this.leftPortal.position, 500, 4)
        };

        // Position camera
        this.camera.position.x = 0;
        this.camera.position.y = 0;
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

    private async createFlyingPlanes(): Promise<void> {
        const planeCount = 30;

        // Different colors for each plane
        const colors = [
            0xff0000, // Bright Red
            0x00ff00, // Lime Green
            0x0000ff, // Blue
            0xff00ff, // Magenta
            0x00ffff, // Cyan
            0xff8800, // Orange
            0xff0088, // Hot Pink
            0x88ff00, // Chartreuse
            0x0088ff, // Sky Blue
            0x8800ff, // Purple
            0xffff00, // Yellow
            0x00ff88, // Spring Green
            0xff0044, // Coral Red
            0x44ff00, // Neon Green
            0x0044ff  // Royal Blue
        ];

        for (let i = 0; i < planeCount; i++) {
            const planeModel = new GLBModel('assets/bi-plane2.glb');
            planeModel.setColor(colors[i % colors.length]);
            const group = planeModel.getGroup();
            
            // Randomize position and rotation
            group.position.set(
                (Math.random() - 0.5) * 100,
                Math.random() * 15,
                (Math.random() - 0.5) * 50
            );
            group.rotation.x = Math.PI / 4;
            
            this.flyingPlanes.push(planeModel);
            this.scene.add(group);
        }
    }

    private createPortalLabel(text: string): THREE.Sprite | null {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 33px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);

        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        // Set scale and position
        sprite.scale.set(4, 1, 1);
        sprite.position.set(-10, -5, 0); // Position above the portal

        return sprite;
    }

    private updatePortalLabels(): void {
        if (this.portalLabels.left) {
            // Make label face camera
            this.portalLabels.left.quaternion.copy(this.camera.quaternion);
        }
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
                    color: #000000;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }
                .call-to-action {
                    font-size: 4vh;
                    color: #ff0000;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }
            </style>
            <div class="title">Bi-Plane Panic</div>
            <div class="instructions">WASD to move.</br>Space = Button A</br>Enter = Button B</div>
            <div class="call-to-action">Move your red plane to right to play again.</div>
        `;
    }

    private isMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    public exit(): void {
        // Remove player
        this.scene.remove(this.player.getGroup());
        
        // Remove portal and its glow effects
        this.scene.remove(this.leftPortal);
        
        // Remove runway marking
        this.scene.remove(this.runwayMarking);
        
        // Remove START text
        if (this.startText) {
            this.scene.remove(this.startText);
        }
        
        // Remove ground
        this.scene.remove(this.ground);

        // Remove cityscape
        this.scene.remove(this.cityscape);

        // Remove flying planes
        this.flyingPlanes.forEach(plane => this.scene.remove(plane.getGroup()));
        this.flyingPlanes = [];

        // Remove portal label
        if (this.portalLabels.left) {
            this.scene.remove(this.portalLabels.left);
            this.portalLabels.left.material.dispose();
            this.portalLabels.left = null;
        }

        // Remove title container
        this.titleContainer.remove();

        // Clean up portal starfield
        this.portalStarfields.left.cleanup();

        // Clean up background texture
        if (this.backgroundTexture) {
            this.backgroundTexture.dispose();
            this.backgroundTexture = null;
        }
        this.scene.background = null;

        // Clean up music system
        this.musicSystem.stop();
        this.musicSystem.cleanup();

    }

    public update(deltaTime: number): void {
        // Update flying planes
        this.flyingPlanes.forEach(plane => {
            const group = plane.getGroup();
            group.rotation.y = (Math.PI / 4) * (1 + this.musicSystem.getCurrentBeat() % 8);
            group.position.x += deltaTime * 2;
            if (group.position.x > 50) {
                // Randomize position and rotation
                group.position.set(
                    -50,
                    Math.random() * 15,
                    (Math.random() - 0.5) * 50
                );                
            }
        });

        this.leftPortal.rotation.y += (Math.PI / 8) * (1 + this.musicSystem.getCurrentBeat() % 8);
        this.leftPortal.rotation.x += (Math.PI / 32) * (1 + this.musicSystem.getCurrentBeat() % 32);

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

        // Check for portal and runway marking collisions
        const playerPosition = this.player.getPosition();
        const leftPortalDistance = playerPosition.distanceTo(this.leftPortal.position);
        
        // Check if player is within the runway marking area
        const runwayPosition = this.runwayMarking.position;
        const runwayX = runwayPosition.x;
        const runwayZ = runwayPosition.z;
        const playerX = playerPosition.x;
        const playerZ = playerPosition.z;
        
        // Check if player is within the marking's bounds (2 units wide, 4 units long)
        const isWithinRunwayBounds = 
            Math.abs(playerX - runwayX) < 1 && // Within 1 unit of centerline
            Math.abs(playerZ - runwayZ) < 2;   // Within 2 units of center

        if (leftPortalDistance < this.portalRadius) {
            // Redirect to Google
            window.location.href = 'http://portal.pieter.com';
        } else if (isWithinRunwayBounds) {
            // Transition to PlayState
            const playState = new PlayState(this.scene, this.camera, this.renderer, this.audioSystem);
            playState.setGameStateManager(this.gameStateManager);
            this.gameStateManager.setState(playState);
        }

        // Update portal starfield
        this.portalStarfields.left.update(deltaTime);

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