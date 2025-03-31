import { GameState } from './GameState';
import * as THREE from 'three';
import { GameStateManager } from './GameStateManager';
import { KeyboardHandler } from '../systems/input-handlers/KeyboardHandler';
import { AudioSystem } from '../systems/AudioSystem';
import { ScreenControlHandler } from '../systems/input-handlers/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/input-handlers/JoypadInputHandler';
import { MenuState } from './MenuState';
import { PlayState } from './PlayState';

export class TwoPlayerState implements GameState {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private gameStateManager!: GameStateManager;
    private keyboardHandler!: KeyboardHandler;
    private player1Controls!: ScreenControlHandler;
    private player2Controls!: ScreenControlHandler;
    private joypadHandler!: JoypadInputHandler;
    private audioSystem: AudioSystem;
    private uiContainer: HTMLElement;
    private gameContainer: HTMLElement;
    private twoPlayerContainer: HTMLElement;
    private originalCanvasParent: HTMLElement | null = null;
    private gameArea: HTMLElement;
    private player1Area: HTMLElement | null = null;
    private player2Area: HTMLElement | null = null;
    private playState: PlayState | null = null;

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
        this.uiContainer = uiContainer;
        this.gameContainer = uiContainer.parentElement as HTMLElement;
        
        // Create container for two player mode
        this.twoPlayerContainer = document.createElement('div');
        this.twoPlayerContainer.id = 'two-player-container';
        
        // Create game area element
        this.gameArea = document.createElement('div');
        
        // Setup the layout for two player mode
        this.setupTwoPlayerLayout();
        
        // Controls will be created in the enter method
    }

    public setGameStateManager(gameStateManager: GameStateManager): void {
        this.gameStateManager = gameStateManager;
    }

    private isMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    private setupTwoPlayerLayout(): void {
        // Handle layout only for mobile in portrait orientation
        if (!this.isMobileDevice()) {
            this.showNotSupportedMessage();
            return;
        }

        // Setup game container for vertical orientation
        document.body.style.backgroundColor = '#000';
        
        // Style for the two player container
        this.twoPlayerContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background-color: #000;
            z-index: 10;
        `;
        document.body.appendChild(this.twoPlayerContainer);
        
        // Create player 1 controls container (top)
        const player1Area = document.createElement('div');
        player1Area.id = 'player1-area';
        player1Area.style.cssText = `
            width: 100%;
            height: 25vh;
            display: flex;
            justify-content: center;
            align-items: center;
            transform: rotate(180deg);
            position: relative;
        `;
        this.twoPlayerContainer.appendChild(player1Area);
        this.player1Area = player1Area;
        
        // Create game view container (middle)
        const gameViewContainer = document.createElement('div');
        gameViewContainer.style.cssText = `
            width: 100%;
            height: 50vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #111;
            position: relative;
        `;
        this.twoPlayerContainer.appendChild(gameViewContainer);
        
        // Setup the game area in the middle section
        this.gameArea.style.cssText = `
            width: min(100vw, 50vh * 16/9);
            height: min(50vh, 100vw * 9/16);
            position: relative;
            overflow: hidden;
        `;
        gameViewContainer.appendChild(this.gameArea);
        
        // Create player 2 controls container (bottom)
        const player2Area = document.createElement('div');
        player2Area.id = 'player2-area';
        player2Area.style.cssText = `
            width: 100%;
            height: 25vh;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        `;
        this.twoPlayerContainer.appendChild(player2Area);
        this.player2Area = player2Area;
        
        // Add back button to return to main menu
        const backButton = document.createElement('button');
        backButton.textContent = 'Back to Menu';
        backButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            border: 1px solid white;
            border-radius: 5px;
            z-index: 100;
            font-size: 16px;
        `;
        backButton.addEventListener('click', () => {
            this.returnToMenu();
        });
        gameViewContainer.appendChild(backButton);
        
        // Add labels for the players
        const player1Label = document.createElement('div');
        player1Label.textContent = 'PLAYER 1';
        player1Label.style.cssText = `
            position: absolute;
            left: 10px;
            top: 10px;
            color: white;
            font-size: 18px;
            transform: rotate(180deg);
            z-index: 100;
        `;
        player1Area.appendChild(player1Label);
        
        const player2Label = document.createElement('div');
        player2Label.textContent = 'PLAYER 2';
        player2Label.style.cssText = `
            position: absolute;
            left: 10px;
            top: 10px;
            color: white;
            font-size: 18px;
            z-index: 100;
        `;
        player2Area.appendChild(player2Label);
    }
    
    private moveCanvasToGameArea(): void {
        // Save original canvas parent for later restoration
        this.originalCanvasParent = this.renderer.domElement.parentElement;
        
        // Move the canvas to our game area
        if (this.renderer.domElement.parentElement) {
            this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
        }
        
        this.gameArea.appendChild(this.renderer.domElement);
        
        // Update renderer size to fit the game area
        this.renderer.setSize(this.gameArea.clientWidth, this.gameArea.clientHeight);
        
        // Update camera aspect ratio
        this.camera.aspect = 16/9;
        this.camera.updateProjectionMatrix();
    }
    
    private restoreCanvas(): void {
        // Restore the canvas to its original parent
        if (this.originalCanvasParent && this.renderer.domElement.parentElement) {
            this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
            this.originalCanvasParent.appendChild(this.renderer.domElement);
            
            // Reset renderer size
            this.renderer.setSize(this.gameContainer.clientWidth, this.gameContainer.clientHeight);
            
            // Reset camera aspect ratio
            this.camera.aspect = 16/9;
            this.camera.updateProjectionMatrix();
        }
    }
    
    private showNotSupportedMessage(): void {
        const messageContainer = document.createElement('div');
        messageContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background-color: rgba(0,0,0,0.9);
            color: white;
            z-index: 1000;
            font-size: 24px;
            text-align: center;
            padding: 20px;
        `;
        
        const message = document.createElement('p');
        message.textContent = '2 Player mode is currently only supported on mobile devices in portrait orientation.';
        
        const backButton = document.createElement('button');
        backButton.textContent = 'Back to Menu';
        backButton.style.cssText = `
            margin-top: 20px;
            padding: 10px 20px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid white;
            border-radius: 5px;
            font-size: 18px;
        `;
        backButton.addEventListener('click', () => {
            this.returnToMenu();
        });
        
        messageContainer.appendChild(message);
        messageContainer.appendChild(backButton);
        document.body.appendChild(messageContainer);
    }

    private handlePlayer1Input(event: string, isPress: boolean): void {
        // Forward to PlayState if it exists
        if (this.playState) {
            this.playState.handleInputOverride(`player1_${event}`, isPress);
        }
    }

    private handlePlayer2Input(event: string, isPress: boolean): void {
        // Forward to PlayState if it exists
        if (this.playState) {
            this.playState.handleInputOverride(`player2_${event}`, isPress);
        }
    }
    
    private returnToMenu(): void {
        // Return to menu state
        if (this.playState) {
            // First exit the play state if it exists
            this.playState = null;
        }
        
        const menuState = new MenuState(this.scene, this.camera, this.renderer, this.audioSystem, this.uiContainer);
        menuState.setGameStateManager(this.gameStateManager);
        this.gameStateManager.setState(menuState);
    }

    private startTwoPlayerGame(): void {
        // Create a new PlayState with 2-player mode
        this.playState = new PlayState(
            this.scene, 
            this.camera, 
            this.renderer, 
            this.audioSystem, 
            this.uiContainer, 
            { 
                twoPlayerMode: true, 
                player2Controls: this.player2Controls,
                player1Area: this.player1Area,
                player2Area: this.player2Area
            }
        );
        this.playState.setGameStateManager(this.gameStateManager);
        
        // Pass the TwoPlayerState instance for callbacks
        this.playState.setTwoPlayerState(this);
        
        this.gameStateManager.setState(this.playState);
    }

    public setInputHandlers(
        keyboardHandler: KeyboardHandler,
        screenControlHandler: ScreenControlHandler,
        joypadHandler: JoypadInputHandler
    ): void {
        this.keyboardHandler = keyboardHandler;
        this.joypadHandler = joypadHandler;
        
        // Use the shared screenControlHandler as player1Controls
        this.player1Controls = screenControlHandler;
        
        // Set up event handlers
        this.player1Controls.setEventHandler(this.handlePlayer1Input.bind(this));
        
        // Set up player2Controls if not already created
        if (!this.player2Controls) {
            this.player2Controls = new ScreenControlHandler(this.handlePlayer2Input.bind(this));
        }
    }

    async enter(): Promise<void> {
        // Move canvas to our game area
        this.moveCanvasToGameArea();
        
        // Create the control handlers once
        if (!this.player1Controls || !this.player2Controls) {
            this.player1Controls = new ScreenControlHandler(this.handlePlayer1Input.bind(this));
            this.player2Controls = new ScreenControlHandler(this.handlePlayer2Input.bind(this));
        }
        
        // Show the controls
        this.player1Controls.showControls();
        this.player2Controls.showControls();
        
        // Move the controls to their areas
        this.moveControlToArea(this.player1Controls, this.player1Area);
        this.moveControlToArea(this.player2Controls, this.player2Area);
        
        // Position camera for the game view
        this.camera.position.z = 5;
        this.camera.position.y = 0;
        this.camera.position.x = 0;
        
        // Start the game automatically after a brief delay to let players get ready
        setTimeout(() => {
            this.startTwoPlayerGame();
        }, 1500);
    }

    // Helper to move controls to an area
    private moveControlToArea(control: ScreenControlHandler, area: HTMLElement | null): void {
        if (!control || !area) return;
        
        if ('container' in control) {
            const container = control['container'] as HTMLElement;
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
            area.appendChild(container);
        }
    }

    exit(): void {
        // If we're exiting to PlayState, don't restore canvas or clean up controls
        if (this.playState) {
            // Let the PlayState keep using our controls
            return;
        }
        
        // Restore canvas to its original location
        this.restoreCanvas();
        
        // Clean up when leaving this state
        if (this.twoPlayerContainer && this.twoPlayerContainer.parentNode) {
            this.twoPlayerContainer.parentNode.removeChild(this.twoPlayerContainer);
        }
        
        // Clean up controls only if not transferring to PlayState
        if (this.player1Controls) {
            this.player1Controls.hideControls();
            this.player1Controls.destroy();
        }
        
        if (this.player2Controls) {
            this.player2Controls.hideControls();
            this.player2Controls.destroy();
        }
        
        // Reset document body style if needed
        document.body.style.removeProperty('background-color');
    }

    update(deltaTime: number): void {
        // Update input handlers
        this.keyboardHandler.update();
        this.joypadHandler.update();
        
        // Note: player1Controls and player2Controls handle their own updates
        // through their event listeners
    }

    render(): void {
        this.renderer.render(this.scene, this.camera);
    }
} 