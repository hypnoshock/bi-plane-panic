type KeyboardEventHandler = (event: string, isPress: boolean) => void;

interface KeyMapping {
    up: string[];
    down: string[];
    left: string[];
    right: string[];
    button1: string[];
    button2: string[];
}

export class KeyboardHandler {
    private keys: Set<string> = new Set();
    private eventHandler: KeyboardEventHandler;
    private keydownListener: (event: KeyboardEvent) => void;
    private keyupListener: (event: KeyboardEvent) => void;
    private keyMapping: KeyMapping;

    constructor(eventHandler: KeyboardEventHandler, keyMapping: KeyMapping) {
        this.eventHandler = eventHandler;
        this.keyMapping = keyMapping;
        this.keydownListener = this.handleKeydown.bind(this);
        this.keyupListener = this.handleKeyup.bind(this);
        this.setupEventListeners();
    }

    public setEventHandler(eventHandler: KeyboardEventHandler): void {
        this.eventHandler = eventHandler;
    }

    private setupEventListeners(): void {
        window.addEventListener('keydown', this.keydownListener);
        window.addEventListener('keyup', this.keyupListener);
    }

    private handleKeydown(event: KeyboardEvent): void {
        const key = event.key.toLowerCase();
        // Check if the key is in any of our mappings
        const isMappedKey = Object.values(this.keyMapping).some(keys => keys.includes(key));
        if (isMappedKey) {
            event.preventDefault();
            event.stopPropagation();
            if (!this.keys.has(key)) {
                this.keys.add(key);
                this.handleKeyEvent(key, true);
            }
        }
    }

    private handleKeyup(event: KeyboardEvent): void {
        const key = event.key.toLowerCase();
        // Check if the key is in any of our mappings
        const isMappedKey = Object.values(this.keyMapping).some(keys => keys.includes(key));
        if (isMappedKey) {
            event.preventDefault();
            event.stopPropagation();
            if (this.keys.has(key)) {
                this.keys.delete(key);
                this.handleKeyEvent(key, false);
            }
        }
    }

    private handleKeyEvent(key: string, isPress: boolean): void {
        // Check each mapping to find which action this key corresponds to
        for (const [action, keys] of Object.entries(this.keyMapping)) {
            if (keys.includes(key)) {
                this.eventHandler(action, isPress);
                break;
            }
        }
    }

    public update(): void {
        // No need to do anything in update anymore
        // All key handling is done through the event listeners
    }

    public destroy(): void {
        window.removeEventListener('keydown', this.keydownListener);
        window.removeEventListener('keyup', this.keyupListener);
    }
} 