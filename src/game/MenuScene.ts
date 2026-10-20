import Phaser from 'phaser';
import { GAME_WIDTH, px } from './display';
import type { BottleColor } from './types';
import { POINTER_CURSOR, useArrowCursor } from './cursors';
import { createMusicButton, playBackgroundMusic } from './music';
import { addBottleShadow, sliceBottleSheet, useSharpTextures } from './sharpBottles';

const SLOT_X = [295 / 1380, 558 / 1380, 821 / 1380, 1084 / 1380];
const TOP_SHELF_Y = 318 / 1140;
const BOTTOM_SHELF_Y = 748 / 1140;
const BOTTOM_BOTTLE_HEIGHT = 0.23;
const SHADOW_HEIGHT = BOTTOM_BOTTLE_HEIGHT * 0.94;
const LIP_TOP = 330;
const LIP_HEIGHT = 96;
const RACK_HEIGHT = 404;
const RACK_CENTER_Y = 418;
const TITLE_Y = 104;
const TITLE_WIDTH = 430;
const DISPLAY_ORDER: BottleColor[] = ['red', 'yellow', 'blue', 'green'];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload(): void {
    this.load.image('title', 'images/title.png');
    this.load.image('play', 'images/play-btn.png');
    this.load.image('sound', 'images/mute-unmute.png');
    this.load.audio('bg', 'audio/bg.mp3');
    this.load.image('rack', 'images/rack2.png');
    this.load.image('cover', 'images/Cover.png');
    this.load.image('bottles', 'images/bottles.png');
    this.load.image('bottle-shadow-src', 'images/bottle-shadow.png');
  }

  create(): void {
    useArrowCursor(this);
    useSharpTextures(this);
    sliceBottleSheet(this);

    const rack = this.add.image(GAME_WIDTH / 2, px(RACK_CENTER_Y), 'rack', '__BASE').setDepth(2);
    const rackScale = px(RACK_HEIGHT) / rack.height;
    rack.setScale(rackScale);
    this.addShelfLip(rack, rackScale);

    DISPLAY_ORDER.forEach((color, index) => {
      const point = this.slotPoint(rack, index, TOP_SHELF_Y);
      const frame = this.textures.getFrame(color);
      const scale = (rack.displayHeight * 0.26) / frame.height;
      this.add.image(point.x, point.y, color).setOrigin(0.5, 1).setScale(scale).setDepth(5);
    });

    const coverWidth = rack.displayWidth * 0.9;
    const cover = this.add.image(rack.x, 0, 'cover').setDepth(4);
    cover.setScale(coverWidth / cover.width);
    const topShelf = this.slotPoint(rack, 0, TOP_SHELF_Y).y;
    cover.setY(topShelf + cover.displayHeight * 0.42);

    addBottleShadow(this);
    const shadowHeight = rack.displayHeight * SHADOW_HEIGHT;
    DISPLAY_ORDER.forEach((_, index) => {
      const bottom = this.slotPoint(rack, index, BOTTOM_SHELF_Y);
      const shadow = this.add.image(bottom.x, bottom.y, 'bottle-shadow');
      shadow.setOrigin(0.5, 1).setDepth(5).setAlpha(0.88).setScale(shadowHeight / shadow.height);
    });

    const title = this.add.image(GAME_WIDTH / 2, px(TITLE_Y), 'title').setDepth(8);
    title.setScale(px(TITLE_WIDTH) / title.width);

    this.addPlayButton(GAME_WIDTH / 2, px(656));
    createMusicButton(this);
    playBackgroundMusic(this);
  }

  private slotPoint(rack: Phaser.GameObjects.Image, index: number, yFrac: number): { x: number; y: number } {
    return {
      x: rack.x - rack.displayWidth / 2 + SLOT_X[index] * rack.displayWidth,
      y: rack.y - rack.displayHeight / 2 + yFrac * rack.displayHeight,
    };
  }

  private addShelfLip(rack: Phaser.GameObjects.Image, rackScale: number): void {
    const rackTexture = this.textures.get('rack');
    if (!rackTexture.has('lip')) {
      rackTexture.add('lip', 0, 0, LIP_TOP, rack.width, LIP_HEIGHT);
    }

    const lipCenter = LIP_TOP + LIP_HEIGHT / 2;
    this.add
      .image(rack.x, rack.y + (lipCenter - rack.height / 2) * rackScale, 'rack', 'lip')
      .setScale(rackScale)
      .setDepth(6);
  }

  private addPlayButton(x: number, y: number): void {
    const button = this.add.image(x, y, 'play').setDepth(9);
    const base = px(300) / button.width;
    button.setScale(base);
    button.setInteractive({ cursor: POINTER_CURSOR });

    button.on('pointerover', () => button.setScale(base * 1.05));
    button.on('pointerout', () => button.setScale(base));
    button.on('pointerdown', () => {
      button.disableInteractive();
      this.tweens.add({
        targets: button,
        scale: base * 0.96,
        duration: 80,
        yoyo: true,
        onComplete: () => this.scene.start('GameScene'),
      });
    });
  }
}
