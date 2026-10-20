import Phaser from 'phaser';
import type { BottleColor } from './types';
import { POINTER_CURSOR, useArrowCursor } from './cursors';
import { createMusicButton, layoutMusicButton, playBackgroundMusic } from './music';
import { stageFrame } from './responsive';
import { addBottleShadow, sliceBottleSheet, useSharpTextures } from './sharpBottles';

const SLOT_X = [295 / 1380, 558 / 1380, 821 / 1380, 1084 / 1380];
const TOP_SHELF_Y = 318 / 1140;
const BOTTOM_SHELF_Y = 748 / 1140;
const BOTTOM_BOTTLE_HEIGHT = 0.23;
const SHADOW_HEIGHT = BOTTOM_BOTTLE_HEIGHT * 0.94;
const LIP_TOP = 330;
const LIP_HEIGHT = 96;
const DISPLAY_ORDER: BottleColor[] = ['red', 'yellow', 'blue', 'green'];

export class MenuScene extends Phaser.Scene {
  private rack!: Phaser.GameObjects.Image;
  private lip!: Phaser.GameObjects.Image;
  private title!: Phaser.GameObjects.Image;
  private play!: Phaser.GameObjects.Image;
  private cover!: Phaser.GameObjects.Image;
  private menuBottles: Phaser.GameObjects.Image[] = [];
  private shadows: Phaser.GameObjects.Image[] = [];
  private playBase = 1;

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

    this.rack = this.add.image(0, 0, 'rack', '__BASE').setDepth(2);
    this.lip = this.add.image(0, 0, 'rack').setDepth(6);
    this.addShelfLipFrame();

    this.menuBottles = DISPLAY_ORDER.map((color) =>
      this.add.image(0, 0, color).setOrigin(0.5, 1).setDepth(5),
    );

    this.cover = this.add.image(0, 0, 'cover').setDepth(4);
    addBottleShadow(this);
    this.shadows = DISPLAY_ORDER.map(() =>
      this.add.image(0, 0, 'bottle-shadow').setOrigin(0.5, 1).setDepth(5).setAlpha(0.88),
    );

    this.title = this.add.image(0, 0, 'title').setDepth(8);
    this.play = this.add.image(0, 0, 'play').setDepth(9);
    this.bindPlayButton();

    createMusicButton(this);
    playBackgroundMusic(this);
    this.layoutMenu();

    this.scale.on('resize', this.layoutMenu, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layoutMenu, this);
    });
  }

  private layoutMenu = (): void => {
    if (!this.play?.active) {
      return;
    }
    const frame = stageFrame(this.scale.width, this.scale.height);
    layoutMusicButton(this);

    const landscapePhone = !frame.portrait && frame.kind === 'phone';
    const titleScale = Math.min(
      (frame.portrait
        ? frame.width * 0.76
        : landscapePhone
          ? frame.width * 0.32
          : Math.min(frame.width * 0.34, frame.height * 0.62)) / this.title.width,
      (frame.height * (frame.portrait ? 0.13 : landscapePhone ? 0.11 : 0.16)) / this.title.height,
    );
    this.title.setScale(titleScale);

    this.playBase = Math.min(
      (frame.portrait
        ? frame.width * 0.58
        : landscapePhone
          ? frame.width * 0.22
          : Math.min(frame.width * 0.26, frame.height * 0.48)) / this.play.width,
      (frame.height * (frame.portrait ? 0.1 : landscapePhone ? 0.1 : 0.13)) / this.play.height,
    );
    this.play.setScale(this.playBase);

    const gap = frame.pad * (frame.portrait ? 1 : 0.65);
    const topLimit = frame.pad + this.title.displayHeight + gap;
    const bottomLimit = frame.height - frame.pad - this.play.displayHeight - gap;
    const rackScale = Math.min(
      Math.max(48, bottomLimit - topLimit) / this.rack.height,
      (frame.width - frame.pad * 2) / this.rack.width,
    );
    this.rack.setScale(rackScale);

    this.title.setPosition(frame.centerX, frame.pad + this.title.displayHeight / 2);
    this.play.setPosition(
      frame.centerX,
      frame.height - frame.pad - this.play.displayHeight / 2,
    );
    const rackTop = this.title.y + this.title.displayHeight / 2 + gap;
    const rackRoom = Math.max(this.rack.displayHeight, bottomLimit - rackTop);
    this.rack.setPosition(
      frame.centerX,
      rackTop + (rackRoom - this.rack.displayHeight) / 2 + this.rack.displayHeight / 2,
    );
    this.layoutMenuPieces();
  };

  private layoutMenuPieces(): void {
    const rack = this.rack;
    const rackScale = rack.scaleX;
    const lipCenter = LIP_TOP + LIP_HEIGHT / 2;
    this.lip
      .setPosition(rack.x, rack.y + (lipCenter - rack.height / 2) * rackScale)
      .setScale(rackScale);

    this.menuBottles.forEach((sprite, index) => {
      const point = this.slotPoint(rack, index, TOP_SHELF_Y);
      const art = this.textures.getFrame(DISPLAY_ORDER[index]);
      sprite.setPosition(point.x, point.y).setScale((rack.displayHeight * 0.26) / art.height);
    });

    this.cover.setScale((rack.displayWidth * 0.9) / this.cover.width);
    const topShelf = this.slotPoint(rack, 0, TOP_SHELF_Y).y;
    this.cover.setPosition(rack.x, topShelf + this.cover.displayHeight * 0.42);

    const shadowHeight = rack.displayHeight * SHADOW_HEIGHT;
    this.shadows.forEach((shadow, index) => {
      const bottom = this.slotPoint(rack, index, BOTTOM_SHELF_Y);
      shadow.setPosition(bottom.x, bottom.y).setScale(shadowHeight / shadow.height);
    });
  }

  private slotPoint(
    rack: Phaser.GameObjects.Image,
    index: number,
    yFrac: number,
  ): { x: number; y: number } {
    return {
      x: rack.x - rack.displayWidth / 2 + SLOT_X[index] * rack.displayWidth,
      y: rack.y - rack.displayHeight / 2 + yFrac * rack.displayHeight,
    };
  }

  private addShelfLipFrame(): void {
    const rackTexture = this.textures.get('rack');
    if (!rackTexture.has('lip')) {
      rackTexture.add('lip', 0, 0, LIP_TOP, this.rack.width, LIP_HEIGHT);
    }
    this.lip.setTexture('rack', 'lip');
  }

  private bindPlayButton(): void {
    const button = this.play;
    const hitW = button.width * 1.2;
    const hitH = button.height * 1.25;
    button.setInteractive({
      cursor: POINTER_CURSOR,
      hitArea: new Phaser.Geom.Rectangle(
        (button.width - hitW) / 2,
        (button.height - hitH) / 2,
        hitW,
        hitH,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });

    button.on('pointerover', () => button.setScale(this.playBase * 1.05));
    button.on('pointerout', () => button.setScale(this.playBase));
    button.on('pointerdown', () => {
      button.disableInteractive();
      this.tweens.add({
        targets: button,
        scale: this.playBase * 0.96,
        duration: 80,
        yoyo: true,
        onComplete: () => this.scene.start('GameScene'),
      });
    });
  }
}
