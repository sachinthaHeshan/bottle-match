import Phaser from 'phaser';
import './style.css';
import { GameScene } from './game/GameScene';
import { MenuScene } from './game/MenuScene';
import { applyResponsiveGameScale, gameBaseSize } from './game/responsive';

const base = gameBaseSize();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: base.width,
  height: base.height,
  transparent: true,
  scene: [MenuScene, GameScene],
  antialias: true,
  antialiasGL: true,
  pixelArt: false,
  roundPixels: false,
  mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
  input: {
    activePointers: 2,
    touch: {
      capture: true,
    },
  },
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});

applyResponsiveGameScale(game);

declare global {
  interface Window {
    game: Phaser.Game;
  }
}

window.game = game;
