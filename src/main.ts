import Phaser from 'phaser';
import './style.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/display';
import { GameScene } from './game/GameScene';
import { MenuScene } from './game/MenuScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  transparent: true,
  scene: [MenuScene, GameScene],
  antialias: true,
  antialiasGL: true,
  pixelArt: false,
  roundPixels: false,
  mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
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
