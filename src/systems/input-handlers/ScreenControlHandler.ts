type ScreenControlEventHandler = (event: string, isPress: boolean) => void;

export class ScreenControlHandler {
    private eventHandler: ScreenControlEventHandler;
    private container: HTMLDivElement = document.createElement('div');
    private directionPad: HTMLDivElement = document.createElement('div');
    private button1: HTMLDivElement = document.createElement('div');
    private button2: HTMLDivElement = document.createElement('div');
    private isActive: boolean = false;
    private activeDirections: Set<string> = new Set();
    private directionPadTouchId: number | null = null;
    private button1TouchId: number | null = null;
    private button2TouchId: number | null = null;

    constructor(eventHandler: ScreenControlEventHandler) {
        this.eventHandler = eventHandler;
        this.createControls();
        this.setupEventListeners();
    }

    public setEventHandler(eventHandler: ScreenControlEventHandler): void {
        this.eventHandler = eventHandler;
    }

    public showControls(): void {
        this.container.style.display = 'flex';
    }

    public hideControls(): void {
        this.container.style.display = 'none';
    }

    public toggleControls(): void {
        if (this.container.style.display === 'none') {
            this.showControls();
        } else {
            this.hideControls();
        }
    }

    private createControls(): void {
        // Create main container
        this.container.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            pointer-events: none;
            z-index: 1000;
        `;

        // Create direction pad
        this.directionPad.style.cssText = `
            width: 150px;
            height: 150px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            position: relative;
            pointer-events: auto;
            touch-action: none;
        `;

        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            margin-top: 50px;
            display: flex;
            gap: 20px;
            pointer-events: auto;
            touch-action: none;
        `;

        // Create button 1
        this.button1.style.cssText = `
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            touch-action: none;
        `;
        this.button1.textContent = 'A';

        // Create button 2
        this.button2.style.cssText = `
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            touch-action: none;
        `;
        this.button2.textContent = 'B';

        // Assemble the controls
        buttonsContainer.appendChild(this.button1);
        buttonsContainer.appendChild(this.button2);
        this.container.appendChild(this.directionPad);
        this.container.appendChild(buttonsContainer);
        document.body.appendChild(this.container);
    }

    private setupEventListeners(): void {
        // Direction pad events
        this.directionPad.addEventListener('touchstart', (e) => {
            // Process all touches in the event
            Array.from(e.touches).forEach(touch => {
                const rect = this.directionPad.getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                    touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    e.preventDefault();
                    this.isActive = true;
                    this.directionPadTouchId = touch.identifier;
                    this.handleDirectionPadTouch(e);
                }
            });
        });

        this.directionPad.addEventListener('touchmove', (e) => {
            if (!this.isActive || this.directionPadTouchId === null) return;
            
            // Find our active touch
            const touch = Array.from(e.touches).find(t => t.identifier === this.directionPadTouchId);
            if (!touch) return;
            
            e.preventDefault();
            this.handleDirectionPadTouch(e);
        });

        this.directionPad.addEventListener('touchend', (e) => {
            // Only handle this touch if it's our active direction pad touch
            if (e.changedTouches[0].identifier === this.directionPadTouchId) {
                this.isActive = false;
                this.directionPadTouchId = null;
                this.eventHandler('up', false);
                this.eventHandler('down', false);
                this.eventHandler('left', false);
                this.eventHandler('right', false);
            }
        });

        // Button 1 events
        this.button1.addEventListener('touchstart', (e) => {
            // Process all touches in the event
            Array.from(e.touches).forEach(touch => {
                const rect = this.button1.getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                    touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    e.preventDefault();
                    this.button1TouchId = touch.identifier;
                    this.eventHandler('button1', true);
                }
            });
        });

        this.button1.addEventListener('touchend', (e) => {
            // Only handle this touch if it's our active button 1 touch
            if (e.changedTouches[0].identifier === this.button1TouchId) {
                e.preventDefault();
                this.button1TouchId = null;
                this.eventHandler('button1', false);
            }
        });

        // Button 2 events
        this.button2.addEventListener('touchstart', (e) => {
            // Process all touches in the event
            Array.from(e.touches).forEach(touch => {
                const rect = this.button2.getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                    touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    e.preventDefault();
                    this.button2TouchId = touch.identifier;
                    this.eventHandler('button2', true);
                }
            });
        });

        this.button2.addEventListener('touchend', (e) => {
            // Only handle this touch if it's our active button 2 touch
            if (e.changedTouches[0].identifier === this.button2TouchId) {
                e.preventDefault();
                this.button2TouchId = null;
                this.eventHandler('button2', false);
            }
        });
    }

    private handleDirectionPadTouch(e: TouchEvent): void {
        // Find our active touch
        const touch = Array.from(e.touches).find(t => t.identifier === this.directionPadTouchId);
        if (!touch) return;

        const rect = this.directionPad.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        
        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Only trigger if touch is outside dead zone (10% of radius)
        if (distance > rect.width * 0.1) {
            // Normalize the direction vector
            const normalizedX = deltaX / distance;
            const normalizedY = deltaY / distance;

            // Use thresholds to determine direction
            const threshold = 0.5; // Adjust this value to change sensitivity

            // Horizontal movement
            if (normalizedX > threshold) {
                if (!this.activeDirections.has('right')) {
                    this.activeDirections.add('right');
                    this.eventHandler('right', true);
                }
                if (this.activeDirections.has('left')) {
                    this.activeDirections.delete('left');
                    this.eventHandler('left', false);
                }
            } else if (normalizedX < -threshold) {
                if (!this.activeDirections.has('left')) {
                    this.activeDirections.add('left');
                    this.eventHandler('left', true);
                }
                if (this.activeDirections.has('right')) {
                    this.activeDirections.delete('right');
                    this.eventHandler('right', false);
                }
            } else {
                if (this.activeDirections.has('left')) {
                    this.activeDirections.delete('left');
                    this.eventHandler('left', false);
                }
                if (this.activeDirections.has('right')) {
                    this.activeDirections.delete('right');
                    this.eventHandler('right', false);
                }
            }

            // Vertical movement
            if (normalizedY > threshold) {
                if (!this.activeDirections.has('down')) {
                    this.activeDirections.add('down');
                    this.eventHandler('down', true);
                }
                if (this.activeDirections.has('up')) {
                    this.activeDirections.delete('up');
                    this.eventHandler('up', false);
                }
            } else if (normalizedY < -threshold) {
                if (!this.activeDirections.has('up')) {
                    this.activeDirections.add('up');
                    this.eventHandler('up', true);
                }
                if (this.activeDirections.has('down')) {
                    this.activeDirections.delete('down');
                    this.eventHandler('down', false);
                }
            } else {
                if (this.activeDirections.has('up')) {
                    this.activeDirections.delete('up');
                    this.eventHandler('up', false);
                }
                if (this.activeDirections.has('down')) {
                    this.activeDirections.delete('down');
                    this.eventHandler('down', false);
                }
            }
        } else {
            // Reset all directions when in dead zone
            const directionsToReset = Array.from(this.activeDirections);
            directionsToReset.forEach(direction => {
                this.activeDirections.delete(direction);
                this.eventHandler(direction, false);
            });
        }
    }

    public update(): void {
        // No need to do anything in update
        // All control handling is done through touch events
    }

    public destroy(): void {
        // Reset all active directions when destroying
        const directionsToReset = Array.from(this.activeDirections);
        directionsToReset.forEach(direction => {
            this.eventHandler(direction, false);
        });
        this.activeDirections.clear();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }

    public getContainer(): HTMLDivElement {
        return this.container;
    }
} 