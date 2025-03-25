type KeyboardEventHandler = (event: string, isPress: boolean) => void;

export class KeyboardHandler {
    private keys: Set<string> = new Set();
    private eventHandler: KeyboardEventHandler;
    private keydownListener: (event: KeyboardEvent) => void;
    private keyupListener: (event: KeyboardEvent) => void;

    constructor(eventHandler: KeyboardEventHandler) {
        this.eventHandler = eventHandler;
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
        // Only handle game control keys
        if (['w', 'a', 's', 'd', ' ', 'enter', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
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
        // Only handle game control keys
        if (['w', 'a', 's', 'd', ' ', 'enter', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            event.preventDefault();
            event.stopPropagation();
            if (this.keys.has(key)) {
                this.keys.delete(key);
                this.handleKeyEvent(key, false);
            }
        }
    }

    private handleKeyEvent(key: string, isPress: boolean): void {
        switch (key) {
            case 'w':
            case 'arrowup':
                this.eventHandler('up', isPress);
                break;
            case 's':
            case 'arrowdown':
                this.eventHandler('down', isPress);
                break;
            case 'a':
            case 'arrowleft':
                this.eventHandler('left', isPress);
                break;
            case 'd':
            case 'arrowright':
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

    public destroy(): void {
        window.removeEventListener('keydown', this.keydownListener);
        window.removeEventListener('keyup', this.keyupListener);
    }
} 