type JoypadEventHandler = (event: string, isPress: boolean) => void;

export class JoypadInputHandler {
    private eventHandler: JoypadEventHandler;
    private gamepad: Gamepad | null = null;
    private isActive: boolean = false;
    private lastButtonStates: boolean[] = [];
    private deadzone: number = 0.1; // 10% deadzone for analog sticks
    private connectedListener: (e: GamepadEvent) => void;
    private disconnectedListener: (e: GamepadEvent) => void;

    constructor(eventHandler: JoypadEventHandler) {
        this.eventHandler = eventHandler;
        this.connectedListener = this.handleGamepadConnected.bind(this);
        this.disconnectedListener = this.handleGamepadDisconnected.bind(this);
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('gamepadconnected', this.connectedListener);
        window.addEventListener('gamepaddisconnected', this.disconnectedListener);
    }

    private handleGamepadConnected(e: GamepadEvent): void {
        console.log('Gamepad connected:', e.gamepad);
        this.gamepad = e.gamepad;
        this.isActive = true;
        this.lastButtonStates = new Array(e.gamepad.buttons.length).fill(false);
    }

    private handleGamepadDisconnected(): void {
        console.log('Gamepad disconnected');
        this.gamepad = null;
        this.isActive = false;
        this.lastButtonStates = [];
    }

    public update(): void {
        if (!this.isActive || !this.gamepad) return;

        // Update gamepad state
        this.gamepad = navigator.getGamepads()[this.gamepad.index];
        if (!this.gamepad) return;

        // Handle analog sticks
        this.handleAnalogStick(this.gamepad.axes[0], 'left', 'right');
        this.handleAnalogStick(this.gamepad.axes[1], 'up', 'down');

        // Handle buttons
        this.gamepad.buttons.forEach((button, index) => {
            const isPressed = button.pressed;
            const wasPressed = this.lastButtonStates[index];

            if (isPressed !== wasPressed) {
                this.lastButtonStates[index] = isPressed;
                this.handleButton(index, isPressed);
            }
        });
    }

    private handleAnalogStick(value: number, negativeEvent: string, positiveEvent: string): void {
        if (Math.abs(value) > this.deadzone) {
            if (value < 0) {
                this.eventHandler(negativeEvent, true);
                this.eventHandler(positiveEvent, false);
            } else {
                this.eventHandler(positiveEvent, true);
                this.eventHandler(negativeEvent, false);
            }
        } else {
            this.eventHandler(negativeEvent, false);
            this.eventHandler(positiveEvent, false);
        }
    }

    private handleButton(buttonIndex: number, isPressed: boolean): void {
        // Xbox 360 button mapping
        switch (buttonIndex) {
            case 0: // A button
                this.eventHandler('button1', isPressed);
                break;
            case 1: // B button
                this.eventHandler('button2', isPressed);
                break;
            // Add more button mappings as needed
        }
    }

    public destroy(): void {
        // Remove event listeners
        window.removeEventListener('gamepadconnected', this.connectedListener);
        window.removeEventListener('gamepaddisconnected', this.disconnectedListener);

        // Reset all button states when destroying
        if (this.lastButtonStates.length > 0) {
            this.lastButtonStates.forEach((_, index) => {
                this.handleButton(index, false);
            });
        }
    }
} 