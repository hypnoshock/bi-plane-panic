import { Player } from '../game-objects/Player';

type KeyboardEventHandler = (event: string, isPress: boolean) => void;

export class KeyboardHandler {
    private keys: Set<string> = new Set();
    private eventHandler: KeyboardEventHandler;

    constructor(eventHandler: KeyboardEventHandler) {
        this.eventHandler = eventHandler;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            // Only handle game control keys
            if (['w', 'a', 's', 'd', ' ', 'enter'].includes(key)) {
                event.preventDefault();
                event.stopPropagation();
                if (!this.keys.has(key)) {
                    this.keys.add(key);
                    this.handleKeyEvent(key, true);
                }
            }
        });

        window.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            // Only handle game control keys
            if (['w', 'a', 's', 'd', ' ', 'enter'].includes(key)) {
                event.preventDefault();
                event.stopPropagation();
                if (this.keys.has(key)) {
                    this.keys.delete(key);
                    this.handleKeyEvent(key, false);
                }
            }
        });
    }

    private handleKeyEvent(key: string, isPress: boolean): void {
        switch (key) {
            case 'w':
                this.eventHandler('up', isPress);
                break;
            case 's':
                this.eventHandler('down', isPress);
                break;
            case 'a':
                this.eventHandler('left', isPress);
                break;
            case 'd':
                this.eventHandler('right', isPress);
                break;
            case ' ':
                this.eventHandler('button1', isPress);
                break;
            case 'enter':
                this.eventHandler('button2', isPress);
                break;
        }
    }

    public update(): void {
        // No need to do anything in update anymore
        // All key handling is done through the event listeners
    }
} 