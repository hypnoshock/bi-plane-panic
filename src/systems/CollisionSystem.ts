import * as THREE from 'three';
import { Player } from '../game-objects/Player';
import { Bullet } from '../game-objects/Bullet';
import { BulletSystem } from './BulletSystem';
import { ExplosionSystem } from './ExplosionSystem';

export class CollisionSystem {
    private players: Player[] = [];
    private bulletSystem: BulletSystem;
    private explosionSystem: ExplosionSystem;

    constructor(bulletSystem: BulletSystem, explosionSystem: ExplosionSystem) {
        this.bulletSystem = bulletSystem;
        this.explosionSystem = explosionSystem;
    }

    public addPlayer(player: Player): void {
        this.players.push(player);
    }

    public update(): void {
        const bullets = this.bulletSystem.getBullets();
        
        // Check each bullet against each player
        for (const bullet of bullets) {
            const bulletPos = bullet.getGroup().position;
            const bulletPlayerNum = bullet.getPlayerNum();

            for (const player of this.players) {
                // Skip if bullet belongs to this player
                if (bulletPlayerNum === player.getPlayerNum()) {
                    continue;
                }

                const playerPos = player.getPosition();
                const distance = bulletPos.distanceTo(playerPos);

                // If bullet is close enough to player (using a simple sphere collision)
                if (distance < 1.0) { // Adjust this value based on your game's scale
                    // Player takes damage
                    player.takeDamage();
                    
                    // Spawn explosion at player position
                    this.explosionSystem.spawnExplosion(playerPos);
                    
                    // Remove the bullet
                    this.bulletSystem.removeBullet(bullet);
                    break;
                }
            }
        }
    }
} 