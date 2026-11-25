import {BOXES, MAP} from '../shared/map';
import type {Motion, PublicPlayer, Snapshot} from '../shared/protocol';

const size = 200;
const scale = (size - 14) / (2 * Math.max(MAP.halfWidth, MAP.halfDepth));
const coordinate = (world: number) => size / 2 + world * scale;

function background() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0d1b21';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#293c40';
  const west = coordinate(-MAP.halfWidth), north = coordinate(-MAP.halfDepth);
  ctx.fillRect(west, north, MAP.halfWidth * 2 * scale, MAP.halfDepth * 2 * scale);

  ctx.strokeStyle = '#718b872b';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let x = -40; x <= MAP.halfWidth; x += 8) {
    ctx.moveTo(coordinate(x), north); ctx.lineTo(coordinate(x), size - north);
  }
  for (let z = -24; z <= MAP.halfDepth; z += 8) {
    ctx.moveTo(west, coordinate(z)); ctx.lineTo(size - west, coordinate(z));
  }
  ctx.stroke();

  for (const box of BOXES) {
    if (box.y > 1.78) continue;
    const x = coordinate(box.x - box.w / 2);
    const y = coordinate(box.z - box.d / 2);
    const cover = box.h < 3.5;
    ctx.fillStyle = cover ? '#697066' : '#111f24';
    ctx.fillRect(x, y, box.w * scale, box.d * scale);
    ctx.strokeStyle = cover ? '#a6a897' : '#667a79';
    ctx.strokeRect(x, y, box.w * scale, box.d * scale);
  }

  for (const site of MAP.sites) {
    const x = coordinate(site.x);
    const y = coordinate(site.z);
    const color = site.id === 'A' ? '#f5b478' : '#a3d2db';
    ctx.beginPath();
    ctx.arc(x, y, site.radius * scale, 0, Math.PI * 2);
    ctx.fillStyle = color + '26';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#142227';
    ctx.fillRect(x - 6, y - 7, 12, 14);
    ctx.fillStyle = color;
    ctx.fillText(site.id, x, y + 5);
  }
  ctx.fillStyle = '#a0b6af';
  ctx.font = '8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', size / 2, 10);
  return canvas;
}

/** Terrain is static. Live layers only contain teammates and known objectives. */
export class TacticalRadar {
  private readonly terrain = background();
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  draw(snapshot: Snapshot, position: Motion, yaw: number, spectating: PublicPlayer | null) {
    const ctx = this.ctx;
    ctx.drawImage(this.terrain, 0, 0);
    const focus = snapshot.self.alive ? snapshot.self : spectating;
    for (const player of snapshot.players) {
      if (!player.alive || player.team !== snapshot.self.team) continue;
      const local = player.id === snapshot.self.id;
      const highlighted = player.id === focus?.id;
      const {x, z} = local ? position : player;
      ctx.save();
      ctx.translate(coordinate(x), coordinate(z));
      ctx.rotate(local ? -yaw : -player.yaw);
      if (highlighted) {
        ctx.fillStyle = '#dbfbd23d';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 22, -Math.PI * .7, -Math.PI * .3);
        ctx.closePath();
        ctx.fill();
      }
      const radius = highlighted ? 5 : 3.6;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 1.4);
      ctx.lineTo(radius, radius);
      ctx.lineTo(0, radius * .55);
      ctx.lineTo(-radius, radius);
      ctx.closePath();
      ctx.fillStyle = highlighted ? '#edffcc' : '#91c6d4';
      ctx.strokeStyle = '#142126';
      ctx.lineWidth = 1.25;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    const bomb = snapshot.bomb;
    if (!bomb || bomb.terminal || (bomb.state !== 'planted' && snapshot.self.team !== 'attack')) return;
    ctx.save();
    ctx.translate(coordinate(bomb.x), coordinate(bomb.z));
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = '#ffc080';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-4.5, -4.5, 9, 9);
    if (bomb.state !== 'carried') {
      ctx.fillStyle = '#f0a566';
      ctx.fillRect(-2, -2, 4, 4);
    }
    ctx.restore();
  }
}
