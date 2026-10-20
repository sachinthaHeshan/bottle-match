import Phaser from 'phaser';
import { POINTER_CURSOR } from './cursors';
import { stageFrame } from './responsive';

const STORAGE_KEY = 'bottle-match-music-muted';
const MUSIC_VOLUME = 0.45;
const musicButtons = new WeakMap<Phaser.Scene, Phaser.GameObjects.Image>();

export function isMusicMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function setMusicMuted(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // The button still toggles for this visit.
  }
}

function addSoundFrames(scene: Phaser.Scene): void {
  const texture = scene.textures.get('sound');
  if (!texture.has('muted')) {
    texture.add('muted', 0, 31, 37, 834, 799);
  }
  if (!texture.has('on')) {
    texture.add('on', 0, 887, 35, 853, 809);
  }
}

export function layoutMusicButton(scene: Phaser.Scene): void {
  const button = musicButtons.get(scene);
  if (!button?.active) {
    return;
  }
  const frame = stageFrame(scene.scale.width, scene.scale.height);
  button.setPosition(frame.width - frame.pad, frame.pad);
  button.setScale(frame.musicSize / button.frame.height);
}

/**
 * Starts the title-screen track immediately, or on the first click or key press
 * when the browser is still blocking audio.
 */
export function playBackgroundMusic(scene: Phaser.Scene): void {
  const locked = scene.sound.locked;
  syncBackgroundMusic(scene);
  if (!locked) {
    return;
  }

  scene.sound.once('unlocked', () => {
    const music = scene.sound.get('bg');
    if (music?.isPlaying) {
      music.stop();
    }
    syncBackgroundMusic(scene);
  });
}

/** Starts, resumes, or pauses the looping background track to match the mute button. */
export function syncBackgroundMusic(scene: Phaser.Scene): void {
  if (!scene.cache.audio.exists('bg')) {
    return;
  }

  const music = scene.sound.get('bg');
  if (isMusicMuted()) {
    if (music?.isPlaying) {
      music.pause();
    }
    return;
  }

  if (scene.sound.get('victory')?.isPlaying) {
    return;
  }

  if (music?.isPaused) {
    music.resume();
    return;
  }
  if (music?.isPlaying) {
    return;
  }
  scene.sound.play('bg', { loop: true, volume: MUSIC_VOLUME });
}

export function createMusicButton(scene: Phaser.Scene): void {
  addSoundFrames(scene);
  const button = scene.add
    .image(0, 0, 'sound', isMusicMuted() ? 'muted' : 'on')
    .setOrigin(1, 0)
    .setDepth(40);
  musicButtons.set(scene, button);
  layoutMusicButton(scene);
  button.setInteractive({
    cursor: POINTER_CURSOR,
    hitArea: new Phaser.Geom.Circle(button.width / 2, button.height / 2, button.height * 0.62),
    hitAreaCallback: Phaser.Geom.Circle.Contains,
  });

  button.on('pointerdown', () => {
    const muted = !isMusicMuted();
    setMusicMuted(muted);
    button.setFrame(muted ? 'muted' : 'on');
    scene.tweens.killTweensOf(button);
    layoutMusicButton(scene);
    syncBackgroundMusic(scene);
    scene.tweens.add({
      targets: button,
      scale: button.scale * 0.92,
      duration: 70,
      yoyo: true,
    });
  });
}
