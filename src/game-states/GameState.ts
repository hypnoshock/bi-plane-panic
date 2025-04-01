import { KeyboardHandler } from '../systems/input-handlers/KeyboardHandler';
import { ScreenControlHandler } from '../systems/input-handlers/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/input-handlers/JoypadInputHandler';

export interface GameState {
    enter(): void;
    exit(): void;
    update(deltaTime: number): void;
    render(): void;
    setInputHandlers(
        keyboardHandler1: KeyboardHandler,
        keyboardHandler2: KeyboardHandler,
        screenControlHandler: ScreenControlHandler,
        joypadHandler: JoypadInputHandler
    ): void;
} 