import * as THREE from 'three';
import { GameState } from './GameState';
import { KeyboardHandler } from '../systems/KeyboardHandler';
import { ScreenControlHandler } from '../systems/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/JoypadInputHandler';

export class GameStateManager {
    private currentState: GameState | null = null;
    private keyboardHandler: KeyboardHandler;
    private screenControlHandler: ScreenControlHandler;
    private joypadHandler: JoypadInputHandler;

    constructor(
        private scene: THREE.Scene, 
        private camera: THREE.PerspectiveCamera, 
        private renderer: THREE.WebGLRenderer
    ) {
        // Create shared input handlers
        this.keyboardHandler = new KeyboardHandler(() => {});
        this.screenControlHandler = new ScreenControlHandler(() => {});
        this.joypadHandler = new JoypadInputHandler(() => {});
    }

    public setState(state: GameState): void {
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = state;
        this.currentState.setInputHandlers(
            this.keyboardHandler,
            this.screenControlHandler,
            this.joypadHandler
        );
        this.currentState.enter();
    }

    public update(deltaTime: number): void {
        if (this.currentState) {
            this.currentState.update(deltaTime);
        }
    }

    public render(): void {
        if (this.currentState) {
            this.currentState.render();
        }
    }

    public cleanup(): void {
        // Clean up input handlers
        this.keyboardHandler.destroy();
        this.screenControlHandler.destroy();
        this.joypadHandler.destroy();
    }
} 