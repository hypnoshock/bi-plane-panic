export class GameSettings {
    private static instance: GameSettings;
    private _isTwoPlayer: boolean = false;
    private _updateRendererSizeCallback: () => void = () => {};

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

    public set updateRendererSizeCallback(callback: () => void) {
        this._updateRendererSizeCallback = callback;
    }

    public get updateRendererSizeCallback(): () => void {
        return this._updateRendererSizeCallback;
    }
} 