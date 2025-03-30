import { GameState } from './GameState';
import { KeyboardHandler } from '../systems/input-handlers/KeyboardHandler';
import { ScreenControlHandler } from '../systems/input-handlers/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/input-handlers/JoypadInputHandler';
import { AudioSystem } from '../systems/AudioSystem';

export class GameStateManager {
    private currentState: GameState | null = null;
    private keyboardHandler: KeyboardHandler;
    private screenControlHandler: ScreenControlHandler;
    private joypadHandler: JoypadInputHandler;
    private audioSystem: AudioSystem;

    constructor(audioSystem: AudioSystem) {
        this.audioSystem = audioSystem;
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

    public getCurrentState(): GameState | null {
        return this.currentState;
    }
} 