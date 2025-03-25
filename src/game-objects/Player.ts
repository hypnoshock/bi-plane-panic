import * as THREE from 'three';
import { PlaneModel } from '../assets/game-models/PlaneModel';
import { BulletSystem } from '../systems/BulletSystem';

export class Player {
    private model: PlaneModel;
    private group: THREE.Group;
    private moveSpeed: number = 5; // Units per second
    private bulletSystem: BulletSystem | null = null;
    private lastSpacePress: number = 0;
    private fireRate: number = 0.25; // Minimum time between shots in seconds
    private initialPosition: THREE.Vector3;
    private lives: number = 3;
    private isGameOver: boolean = false;
    private isFlashing: boolean = false;
    private flashStartTime: number = 0;
    private flashDuration: number = 200; // Duration in milliseconds
    private originalColor: number = 0x4169e1;
    private flashColor: number = 0xffffff;

    constructor(model: PlaneModel) {
        this.model = model;
        this.group = new THREE.Group();
        this.group.add(this.model.getGroup());
        this.initialPosition = new THREE.Vector3(0, 0, 0);
        this.originalColor = this.model.getColor();
    }

    public setBulletSystem(bulletSystem: BulletSystem): void {
        this.bulletSystem = bulletSystem;
    }

    public update(deltaTime: number): void {
        if (this.isGameOver) return;
        this.model.update();

        // Handle flash effect
        if (this.isFlashing) {
            const currentTime = Date.now();
            const elapsed = currentTime - this.flashStartTime;
            
            if (elapsed >= this.flashDuration) {
                this.isFlashing = false;
                this.model.setColor(this.originalColor);
            } else {
                // Alternate between flash color and original color
                const isWhite = Math.floor(elapsed / 50) % 2 === 0;
                this.model.setColor(isWhite ? this.flashColor : this.originalColor);
            }
        }
    }

    public getGroup(): THREE.Group {
        return this.group;
    }

    public getPosition(): THREE.Vector3 {
        return this.group.position;
    }

    public resetPosition(): void {
        this.group.position.copy(this.initialPosition);
    }

    public moveUp(deltaTime: number): void {
        this.group.position.y += this.moveSpeed * deltaTime;
    }

    public moveDown(deltaTime: number): void {
        this.group.position.y -= this.moveSpeed * deltaTime;
    }

    public moveLeft(deltaTime: number): void {
        this.group.position.x -= this.moveSpeed * deltaTime;
    }

    public moveRight(deltaTime: number): void {
        this.group.position.x += this.moveSpeed * deltaTime;
    }

    public shoot(deltaTime: number): void {
        if (!this.bulletSystem) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastSpacePress >= this.fireRate * 1000) {
            const playerPosition = this.group.position;
            // Spawn bullet in front of the ship (along X axis since ship is rotated 90 degrees around Y)
            const bulletPosition = new THREE.Vector3(
                playerPosition.x + 1.5, // Spawn 1.5 units in front of the ship
                playerPosition.y,
                playerPosition.z
            );
            // Shoot to the right
            const direction = new THREE.Vector3(1, 0, 0);
            this.bulletSystem.spawnBullet(bulletPosition, direction, false);
            this.lastSpacePress = currentTime;
        }
    }

    public getLives(): number {
        return this.lives;
    }

    public isDead(): boolean {
        return this.lives <= 0;
    }

    public takeDamage(): void {
        this.lives--;
        this.isFlashing = true;
        this.flashStartTime = Date.now();
        
        if (this.lives <= 0) {
            this.isGameOver = true;
            this.hideShip();
        }
    }

    public reset(): void {
        this.lives = 3;
        this.isGameOver = false;
        this.isFlashing = false;
        this.model.setColor(this.originalColor);
        this.resetPosition();
    }

    public setGameOver(): void {
        this.isGameOver = true;
        this.hideShip();
    }

    private hideShip(): void {
        this.group.visible = false;
    }
} 