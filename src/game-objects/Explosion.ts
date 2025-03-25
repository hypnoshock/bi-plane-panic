import { ExplosionModel } from '../assets/game-models/ExplosionModel';
import * as THREE from 'three';

export class Explosion {
    private model: ExplosionModel;

    constructor() {
        this.model = new ExplosionModel();
    }

    public getModel(): ExplosionModel {
        return this.model;
    }

    public getGroup(): THREE.Group {
        return this.model.getGroup();
    }

    public setPosition(x: number, y: number, z: number): void {
        this.model.setPosition(x, y, z);
    }

    public update(deltaTime: number): boolean {
        return this.model.update(deltaTime);
    }
} 