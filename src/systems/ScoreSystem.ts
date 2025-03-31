export class ScoreSystem {
    private score: number = 0;
    private hiScore: number = 0;
    private scoreElement: HTMLElement;
    private hiScoreElement: HTMLElement;

    constructor(private uiContainer: HTMLElement) {
        // Load hi-score from localStorage
        const savedHiScore = localStorage.getItem('spaceGameHiScore');
        if (savedHiScore) {
            this.hiScore = parseInt(savedHiScore);
        }

        // Create score display element
        this.scoreElement = document.createElement('div');
        this.scoreElement.style.cssText = `
            position: absolute;
            top: 20rem;
            right: 20rem;
            color: white;
            font-size: 24rem;
            font-family: Arial, sans-serif;
            text-shadow: 2rem 2rem 2rem rgba(0, 0, 0, 0.5);
        `;
        this.scoreElement.textContent = 'Score: 0';
        this.uiContainer.appendChild(this.scoreElement);

        // Create hi-score display element
        this.hiScoreElement = document.createElement('div');
        this.hiScoreElement.style.cssText = `
            position: absolute;
            top: 20rem;
            left: 50%;
            transform: translateX(-50%);
            color: #ffd700;
            font-size: 24rem;
            font-family: Arial, sans-serif;
            text-shadow: 2rem 2rem 2rem rgba(0, 0, 0, 0.5);
        `;
        this.hiScoreElement.textContent = `Hi-Score: ${this.hiScore}`;
        this.uiContainer.appendChild(this.hiScoreElement);
    }

    public addScore(points: number): void {
        this.score += points;
        this.updateDisplay();
        
        // Update hi-score if current score is higher
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            localStorage.setItem('spaceGameHiScore', this.hiScore.toString());
            this.hiScoreElement.textContent = `Hi-Score: ${this.hiScore}`;
        }
    }

    public resetScore(): void {
        this.score = 0;
        this.updateDisplay();
    }

    public getScore(): number {
        return this.score;
    }

    private updateDisplay(): void {
        this.scoreElement.textContent = `Score: ${this.score}`;
    }

    public cleanup(): void {
        this.scoreElement.remove();
        this.hiScoreElement.remove();
    }
} 