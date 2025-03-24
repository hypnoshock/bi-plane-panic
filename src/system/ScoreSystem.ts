export class ScoreSystem {
    private score: number = 0;
    private hiScore: number = 0;
    private scoreElement: HTMLElement;
    private hiScoreElement: HTMLElement;

    constructor() {
        // Load hi-score from localStorage
        const savedHiScore = localStorage.getItem('spaceGameHiScore');
        if (savedHiScore) {
            this.hiScore = parseInt(savedHiScore);
        }

        // Create score display element
        this.scoreElement = document.createElement('div');
        this.scoreElement.style.position = 'absolute';
        this.scoreElement.style.top = '20px';
        this.scoreElement.style.right = '20px';
        this.scoreElement.style.color = 'white';
        this.scoreElement.style.fontSize = '24px';
        this.scoreElement.style.fontFamily = 'Arial, sans-serif';
        this.scoreElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        this.scoreElement.textContent = 'Score: 0';
        document.body.appendChild(this.scoreElement);

        // Create hi-score display element
        this.hiScoreElement = document.createElement('div');
        this.hiScoreElement.style.position = 'absolute';
        this.hiScoreElement.style.top = '20px';
        this.hiScoreElement.style.left = '50%';
        this.hiScoreElement.style.transform = 'translateX(-50%)';
        this.hiScoreElement.style.color = '#ffd700'; // Gold color for hi-score
        this.hiScoreElement.style.fontSize = '24px';
        this.hiScoreElement.style.fontFamily = 'Arial, sans-serif';
        this.hiScoreElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        this.hiScoreElement.textContent = `Hi-Score: ${this.hiScore}`;
        document.body.appendChild(this.hiScoreElement);
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