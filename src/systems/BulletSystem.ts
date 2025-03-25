import * as THREE from 'three';
import { BulletModel } from '../assets/game-models/BulletModel';
import { Bullet } from '../game-objects/Bullet';
import { AudioSystem } from './AudioSystem';

export class BulletSystem {
    private bullets: Bullet[] = [];
    private scene: THREE.Scene;
    private audioSystem: AudioSystem;

    constructor(scene: THREE.Scene, audioSystem: AudioSystem) {
        this.scene = scene;
        this.audioSystem = audioSystem;
    }

    public spawnBullet(position: THREE.Vector3, direction: THREE.Vector3, isEnemy: boolean): void {
        const bulletModel = new BulletModel();
        const bullet = new Bullet(bulletModel, direction, isEnemy);
        bullet.setPosition(position.x, position.y, position.z);
        this.scene.add(bullet.getGroup());
        this.bullets.push(bullet);
        
        // Play bullet sound effect
        this.audioSystem.playBullet();
    }

    public update(deltaTime: number): void {
        // Update all bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            
            const position = bullet.getGroup().position;
            const maxDistance = 20; // Maximum distance bullets can travel

            // Remove bullets that have traveled too far
            if (position.length() > maxDistance) {
                this.scene.remove(bullet.getGroup());
                return false;
            }
            return true;
        });
    }

    public clearBullets(): void {
        this.bullets.forEach(bullet => {
            this.scene.remove(bullet.getGroup());
        });
        this.bullets = [];
    }

} 