import { CHAT_MAX_LENGTH, type ChatChannel, type ChatMessage, type ChatRequest } from '../shared/protocol';
import { $ } from './ui';

// Keep shortcuts clear of movement, equipment, scoreboard and menu controls.
const shortcuts = new Map([
  ...Array.from('FGHIJKLMNOPTUVXYZ', letter => ['Key' + letter, letter] as const),
  ['Comma', ','], ['Period', '.'], ['Slash', '/'],
] as const);
const channels = ['all', 'team'] as const;
const defaults = {all: 'KeyT', team: 'KeyY'};
const recentLifetime = 8500;
const historyLimit = 40;

export class MatchChat {
  private readonly panel = $('match-chat');
  private readonly feed = $('chat-feed');
  private readonly form = $<HTMLFormElement>('chat-form');
  private readonly input = $<HTMLInputElement>('chat-input');
  private readonly keys = {...defaults};
  private readonly lines: {row: HTMLElement; timer: number}[] = [];
  private channel: ChatChannel | null = null;

  constructor(read: (key: string, fallback: string) => string, save: (key: string, value: string) => void,
    send: (request: ChatRequest) => void, private readonly returnToGame: () => void) {
    this.input.maxLength = CHAT_MAX_LENGTH;
    for (const channel of channels) {
      const select = $<HTMLSelectElement>('chat-key-' + channel);
      for (const [code, label] of shortcuts) select.add(new Option(label, code));
      const key = read('chat-key-' + channel, defaults[channel]);
      if (shortcuts.has(key)) this.keys[channel] = key;
      select.onchange = () => {
        this.keys[channel] = select.value;
        save('chat-key-' + channel, select.value);
        this.updateShortcuts();
      };
    }
    if (this.keys.all === this.keys.team) {
      this.keys.team = this.keys.all === defaults.team ? defaults.all : defaults.team;
    }
    this.updateShortcuts();
    this.form.onsubmit = event => {
      event.preventDefault();
      const text = this.input.value.trim();
      if (this.channel && text) send({type: 'chat', channel: this.channel, text});
      this.close();
    };
    $('chat-cancel').onclick = () => this.close();
  }

  private updateShortcuts() {
    for (const channel of channels) {
      const select = $<HTMLSelectElement>('chat-key-' + channel);
      select.value = this.keys[channel];
      const other = channel === 'all' ? 'team' : 'all';
      for (const option of select.options) option.disabled = option.value === this.keys[other];
      $('chat-hint-' + channel).textContent = shortcuts.get(this.keys[channel])!;
    }
    $('deploy-chat-keys').textContent = `${shortcuts.get(this.keys.all)} all chat · ${shortcuts.get(this.keys.team)} team chat`;
  }

  shortcut(code: string) {
    return channels.find(channel => this.keys[channel] === code);
  }

  get composing() { return this.channel !== null; }

  open(channel: ChatChannel) {
    this.channel = channel;
    const team = channel === 'team';
    $('chat-channel').textContent = team ? 'Team' : 'All';
    this.input.placeholder = team ? 'Message your team' : 'Message everyone';
    this.input.setAttribute('aria-label', this.input.placeholder);
    this.panel.classList.add('composing');
    this.form.classList.remove('hidden');
    this.feed.scrollTop = this.feed.scrollHeight;
    this.input.focus({preventScroll: true});
  }

  close() {
    if (!this.composing) return;
    this.hideComposer();
    this.returnToGame();
  }

  private hideComposer() {
    this.channel = null;
    this.input.value = '';
    this.form.classList.add('hidden');
    this.panel.classList.remove('composing');
    this.feed.scrollTop = this.feed.scrollHeight;
  }

  receive(message: ChatMessage) {
    const row = document.createElement('div');
    row.className = 'chat-line';
    row.dataset.team = message.team;
    const channel = document.createElement('span');
    channel.className = 'chat-audience';
    channel.textContent = message.channel === 'team' ? 'TEAM' : 'ALL';
    const sender = document.createElement('bdi');
    sender.className = 'chat-sender';
    sender.textContent = message.name;
    const body = document.createElement('bdi');
    body.textContent = message.text;
    row.append(channel, ' ', sender, ' · ', body);
    const atBottom = this.feed.scrollHeight - this.feed.scrollTop - this.feed.clientHeight < 2;
    this.feed.append(row);
    this.lines.push({row, timer: window.setTimeout(() => row.classList.add('expired'), recentLifetime)});
    if (this.lines.length > historyLimit) {
      const oldest = this.lines.shift()!;
      clearTimeout(oldest.timer);
      oldest.row.remove();
    }
    if (!this.composing || atBottom) this.feed.scrollTop = this.feed.scrollHeight;
  }

  reset() {
    this.hideComposer();
    for (const line of this.lines) clearTimeout(line.timer);
    this.lines.length = 0;
    this.feed.replaceChildren();
  }
}
