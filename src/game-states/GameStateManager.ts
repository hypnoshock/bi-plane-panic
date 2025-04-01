import { GameState } from './GameState';
import { KeyboardHandler } from '../systems/input-handlers/KeyboardHandler';
import { ScreenControlHandler } from '../systems/input-handlers/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/input-handlers/JoypadInputHandler';
import { AudioSystem } from '../systems/AudioSystem';

export class GameStateManager {
    private currentState: GameState | null = null;
    private keyboardHandler1: KeyboardHandler;
    private keyboardHandler2: KeyboardHandler;
    private screenControlHandler: ScreenControlHandler;
    private joypadHandler: JoypadInputHandler;
    private audioSystem: AudioSystem;

    constructor(audioSystem: AudioSystem, private uiContainer: HTMLElement) {
        this.audioSystem = audioSystem;
        // Create shared input handlers
        this.keyboardHandler1 = new KeyboardHandler(() => {}, {
            up: ['w', 'arrowup'],
            down: ['s', 'arrowdown'],
            left: ['a', 'arrowleft'],
            right: ['d', 'arrowright'],
            button1: [' '],
            button2: ['enter']
        });
        this.keyboardHandler2 = new KeyboardHandler(() => {}, {
            up: ['i'],
            down: ['k'],
            left: ['j'],
            right: ['l'],
            button1: ['p'],
            button2: []
        });
        this.screenControlHandler = new ScreenControlHandler(() => {});
        this.joypadHandler = new JoypadInputHandler(() => {});
    }

    public setState(state: GameState): void {
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = state;
        this.currentState.setInputHandlers(
            this.keyboardHandler1,
            this.keyboardHandler2,
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
        this.keyboardHandler1.destroy();
        this.keyboardHandler2.destroy();
        this.screenControlHandler.destroy();
        this.joypadHandler.destroy();
    }

    public getCurrentState(): GameState | null {
        return this.currentState;
    }
} 