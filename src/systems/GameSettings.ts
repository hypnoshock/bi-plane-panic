export class GameSettings {
    private static instance: GameSettings;
    private _isTwoPlayer: boolean = false;

    private constructor() {}

    public static getInstance(): GameSettings {
        if (!GameSettings.instance) {
            GameSettings.instance = new GameSettings();
        }
        return GameSettings.instance;
    }

    public get isTwoPlayer(): boolean {
        return this._isTwoPlayer;
    }

    public set isTwoPlayer(value: boolean) {
        this._isTwoPlayer = value;
    }
} 