import Phaser from 'phaser';
import {
  SLOT_COUNT,
  countCorrect,
  createSecret,
  curtainLabel,
  emptySlots,
  isBoardFull,
  placeBottle,
  type BottleColor,
} from './logic';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const SLOT_X = [290 / 1380, 555 / 1380, 821 / 1380, 1088 / 1380];
const TOP_Y = 272 / 1140;
const HIDDEN_Y = 690 / 1140;
const SCORE_Y = 500 / 1140;

export class GameScene extends Phaser.Scene {
  private secret: BottleColor[] = [];
  private playerSlots: (BottleColor | null)[] = emptySlots();
  private selectedColor: BottleColor | null = null;
  private won = false;

  private rack!: Phaser.GameObjects.Image;
  private playerBottles: Phaser.GameObjects.Image[] = [];
  private hiddenBottles: Phaser.GameObjects.Image[] = [];
  private paletteBlue!: Phaser.GameObjects.Image;
  private paletteGreen!: Phaser.GameObjects.Image;
  private blueGlow!: Phaser.GameObjects.Arc;
  private greenGlow!: Phaser.GameObjects.Arc;
  private scoreText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private winOverlay!: Phaser.GameObjects.Container;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    this.load.image('bg', 'images/bg.png');
    this.load.image('rack', 'images/rack.png');
    this.load.image('blue', 'images/blue-bottle.png');
    this.load.image('green', 'images/green-bottle.png');
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg').setDisplaySize(
      GAME_WIDTH,
      GAME_HEIGHT,
    );

    this.add
      .text(GAME_WIDTH / 2, 36, 'Bottle Match', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '42px',
        color: '#fff8e8',
        stroke: '#2d6a4f',
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(8);

    this.hintText = this.add
      .text(GAME_WIDTH / 2, 78, 'Pick a bottle, then tap a slot', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '22px',
        color: '#fff8e8',
        stroke: '#1d4e3a',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(8);

    this.rack = this.add.image(GAME_WIDTH / 2, 318, 'rack');
    const rackScale = Math.min(600 / this.rack.width, 460 / this.rack.height);
    this.rack.setScale(rackScale).setDepth(2);

    const bottleTexture = this.textures.get('blue').getSourceImage();
    const bottleScale = (this.rack.displayWidth * 0.14) / bottleTexture.width;
    const paletteScale = bottleScale * 1.8;

    this.playerBottles = SLOT_X.map((_, index) => {
      const { x, y } = this.slotPoint(index, TOP_Y);
      return this.add
        .image(x, y, 'blue')
        .setOrigin(0.5, 1)
        .setScale(bottleScale)
        .setDepth(3)
        .setVisible(false);
    });

    this.hiddenBottles = SLOT_X.map((_, index) => {
      const { x, y } = this.slotPoint(index, HIDDEN_Y);
      return this.add
        .image(x, y, 'blue')
        .setOrigin(0.5, 1)
        .setScale(bottleScale * 0.95)
        .setDepth(4)
        .setAlpha(0);
    });

    const paletteY = this.rack.y + this.rack.displayHeight / 2 + 58;
    this.blueGlow = this.add
      .circle(GAME_WIDTH / 2 - 130, paletteY, 62, 0xfff4c1, 0.55)
      .setStrokeStyle(5, 0xf0c14a)
      .setDepth(5)
      .setVisible(false);
    this.greenGlow = this.add
      .circle(GAME_WIDTH / 2 + 130, paletteY, 62, 0xfff4c1, 0.55)
      .setStrokeStyle(5, 0xf0c14a)
      .setDepth(5)
      .setVisible(false);

    this.paletteBlue = this.add
      .image(GAME_WIDTH / 2 - 130, paletteY, 'blue')
      .setOrigin(0.5, 0.5)
      .setScale(paletteScale)
      .setDepth(6)
      .setInteractive({ useHandCursor: true });
    this.paletteGreen = this.add
      .image(GAME_WIDTH / 2 + 130, paletteY, 'green')
      .setOrigin(0.5, 0.5)
      .setScale(paletteScale)
      .setDepth(6)
      .setInteractive({ useHandCursor: true });

    this.paletteBlue.on('pointerdown', () => this.selectColor('blue'));
    this.paletteGreen.on('pointerdown', () => this.selectColor('green'));

    SLOT_X.forEach((_, index) => {
      const { x, y } = this.slotPoint(index, TOP_Y);
      const zone = this.add
        .zone(x, y - 50, this.rack.displayWidth * 0.18, 150)
        .setOrigin(0.5, 0.5)
        .setDepth(8)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.onSlotClicked(index));
    });

    const scorePos = this.slotPoint(1, SCORE_Y);
    this.scoreText = this.add
      .text((this.slotPoint(1, SCORE_Y).x + this.slotPoint(2, SCORE_Y).x) / 2, scorePos.y, '?', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '72px',
        color: '#3d2b1f',
        stroke: '#fffaf0',
        strokeThickness: 8,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(7);

    this.winOverlay = this.buildWinOverlay();
    this.winOverlay.setVisible(false);

    this.startRound();
  }

  private slotPoint(index: number, yFrac: number): { x: number; y: number } {
    return {
      x: this.rack.x - this.rack.displayWidth / 2 + SLOT_X[index] * this.rack.displayWidth,
      y: this.rack.y - this.rack.displayHeight / 2 + yFrac * this.rack.displayHeight,
    };
  }

  private startRound(): void {
    this.secret = createSecret();
    this.playerSlots = emptySlots();
    this.selectedColor = null;
    this.won = false;
    this.winOverlay.setVisible(false);
    this.hintText.setVisible(true);
    this.hiddenBottles.forEach((bottle) => bottle.setAlpha(0));
    this.syncPlayerBottles();
    this.syncPalette();
    this.syncCurtain();
  }

  private selectColor(color: BottleColor): void {
    if (this.won) {
      return;
    }
    this.selectedColor = this.selectedColor === color ? null : color;
    this.syncPalette();
  }

  private onSlotClicked(index: number): void {
    if (this.won) {
      return;
    }
    this.playerSlots = placeBottle(this.playerSlots, index, this.selectedColor);
    this.syncPlayerBottles();
    this.syncCurtain();
    this.checkWin();
  }

  private syncPlayerBottles(): void {
    this.playerBottles.forEach((sprite, index) => {
      const color = this.playerSlots[index];
      if (!color) {
        sprite.setVisible(false);
        return;
      }
      sprite.setTexture(color).setVisible(true);
    });
  }

  private syncPalette(): void {
    this.paletteBlue.setScale(this.paletteScaleFor('blue'));
    this.paletteGreen.setScale(this.paletteScaleFor('green'));
    this.paletteBlue.setAlpha(this.won ? 0.55 : 1);
    this.paletteGreen.setAlpha(this.won ? 0.55 : 1);
    this.blueGlow.setVisible(!this.won && this.selectedColor === 'blue');
    this.greenGlow.setVisible(!this.won && this.selectedColor === 'green');
  }

  private paletteScaleFor(color: BottleColor): number {
    const textureWidth = this.textures.get('blue').getSourceImage().width;
    const base = ((this.rack.displayWidth * 0.16) / textureWidth) * 1.8;
    if (this.won) {
      return base;
    }
    return this.selectedColor === color ? base * 1.12 : base;
  }

  private syncCurtain(): void {
    if (this.won) {
      this.scoreText.setVisible(false);
      return;
    }
    this.scoreText.setVisible(true);
    this.scoreText.setText(curtainLabel(this.secret, this.playerSlots));
  }

  private checkWin(): void {
    if (!isBoardFull(this.playerSlots)) {
      return;
    }
    if (countCorrect(this.secret, this.playerSlots) !== SLOT_COUNT) {
      return;
    }
    this.won = true;
    this.secret.forEach((color, index) => {
      this.hiddenBottles[index].setTexture(color).setAlpha(1);
    });
    this.syncPalette();
    this.syncCurtain();
    this.hintText.setVisible(false);
    this.winOverlay.setVisible(true);
  }

  private buildWinOverlay(): Phaser.GameObjects.Container {
    const overlay = this.add.container(GAME_WIDTH / 2, 52).setDepth(10);

    const panel = this.add.rectangle(0, 0, 400, 88, 0x1d4e3a, 0.92);
    panel.setStrokeStyle(4, 0xfff3c4, 1);

    const label = this.add
      .text(0, -16, 'You matched them!', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '26px',
        color: '#fff8e8',
      })
      .setOrigin(0.5);

    const buttonBg = this.add.rectangle(0, 22, 170, 34, 0xf4e3b2, 1);
    buttonBg.setStrokeStyle(2, 0x3d2b1f, 1);
    buttonBg.setInteractive({ useHandCursor: true });

    const buttonText = this.add
      .text(0, 22, 'Play Again', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '20px',
        color: '#3d2b1f',
      })
      .setOrigin(0.5);

    buttonBg.on('pointerdown', () => this.startRound());
    buttonText.setInteractive({ useHandCursor: true });
    buttonText.on('pointerdown', () => this.startRound());

    overlay.add([panel, label, buttonBg, buttonText]);
    return overlay;
  }
}
