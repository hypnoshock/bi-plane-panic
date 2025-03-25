import { KeyboardHandler } from '../systems/KeyboardHandler';
import { ScreenControlHandler } from '../systems/ScreenControlHandler';
import { JoypadInputHandler } from '../systems/JoypadInputHandler';

export interface GameState {
    enter(): void;
    exit(): void;
    update(deltaTime: number): void;
    render(): void;
    setInputHandlers(
        keyboardHandler: KeyboardHandler,
        screenControlHandler: ScreenControlHandler,
        joypadHandler: JoypadInputHandler
    ): void;
} 