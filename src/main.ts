import Phaser from 'phaser';
import './style.css';
import { GameScene } from './game/GameScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#6ec4ea',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});

declare global {
  interface Window {
    game: Phaser.Game;
  }
}

window.game = game;
