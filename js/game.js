import {Game} from "./grid.js";
import {id, add_delegate_event} from "./dom.js";

const sim_1 = {
  size: 384,
  p_0: 1 / 9,
  d_0: 1 / 50,
  sick_start: 4,
  immune_time: 6,
  sick_time: 4,
};

const sim_2 = {
  size: 768,
  p_0: 1 / 3,
  d_0: 0.06,
  sick_start: 768 * 768 * 0.001,
  immune_time: 6,
  sick_time: 2,
};

const sim_3 = {
  size: 768,
  p_0: 1 / 6,
  d_0: 1 / 100,
  sick_start: 768 * 768 * 0.01,
  immune_time: 6,
  sick_time: 2,
};

const sim_4 = {
  size: 768,
  p_0: 1 / 3,
  d_0: 1 / 20,
  sick_start: 768 * 768 * 0.01,
  immune_time: 6,
  sick_time: 3,
};

const cov = {
  size: 768,
  p_0: 1 / 20,
  d_0: 0.06,
  sick_start: 768 * 768 * 0.01,
  immune_time: 6,
  sick_time: 6,
};

class Main {
  constructor() {
    this.game = null;
    this.run = null;
  }

  init() {
    this.game = new Game(id('grid'), {
      size: parseInt(id('size').value),
      p_0: parseFloat(id('propagation').value),
      d_0: parseFloat(id('death-rate').value),
      sick_start: parseInt(id('sick-start').value),
      immune_time: parseInt(id('immune-time').value),
      sick_time: parseInt(id('sick-time').value),
    });

    this.game.init();
  }

  start() {
    this.loop();
  }

  stop() {
    cancelAnimationFrame(this.run);
    clearTimeout(this.run);

    this.run = null;
  }

  loop() {
    this.run = requestAnimationFrame(() => {
      const width = id('graph').offsetWidth;

      this.game.manage();
      const stats = this.game.getStats();

      id('log').textContent = JSON.stringify(stats, null, 2);

      const total = stats.healthy + stats.sick + stats.immune + stats.dead;
      id('healthy').style.width = width * (stats.healthy / total) + 'px';
      id('immune').style.width = width * (stats.immune / total) + 'px';
      id('sick').style.width = width * (stats.sick / total) + 'px';
      id('dead').style.width = width * (stats.dead / total) + 'px';

      if (stats.sick !== 0 && this.run) {
        this.run = setTimeout(() => this.loop(), 50);
      }
    })
  }
}

const main = new Main();

main.init();
main.start();

id('relaunch').addEventListener('click', (ev) => {
  ev.preventDefault();

  main.stop();

  main.init();

  main.start();
});

add_delegate_event(id('main'), 'change, keyup, mousedown, mouseup, mousemove, click', 'input', (ev) => {
  const target = (/** @type {HTMLInputElement}*/ev.target);

  switch (target.id) {
    //case 'size': main.game.size = target.value; break;
    case 'propagation': main.game.p_0 = target.value; break;
    case 'death-rate': main.game.d_0 = target.value; break;
    case 'sick-start': main.game.sick_start = target.value; break;
    case 'sick-time': main.game.sick_time = target.value; break;
    case 'immune-time': main.game.immune_time = target.value; break;
  }
});
