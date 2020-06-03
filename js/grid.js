import {id} from "./dom.js";

/**
 * @typedef {{type: number, value: (number|null), x: number, y: number}} Cell
 */
let Cell;
/**
 * @typedef {{cells: Array<Cell>}} Row
 */
let Row;
/**
 * @typedef {{rows: Array<Row>}} Grid
 */
let Grid;

/** @const */
const C_HEALTHY = 1;
/** @const */
const C_SICK = 2;
/** @const */
const C_IMMUNE = 4;
/** @const */
const C_DEAD = 8;

const C_HEALTHY_COLOR = getComputedStyle(id('healthy'), null).getPropertyValue("background-color");
const C_SICK_COLOR = getComputedStyle(id('sick'), null).getPropertyValue("background-color");
const C_IMMUNE_COLOR =getComputedStyle(id('immune'), null).getPropertyValue("background-color");
const C_DEAD_COLOR = getComputedStyle(id('dead'), null).getPropertyValue("background-color");

const cell_type_str = (cell) => {
  switch (cell.type) {
    case C_HEALTHY :
      return C_HEALTHY_COLOR;
    //return 'healthy';
    case C_IMMUNE :
      return C_IMMUNE_COLOR;
    //return 'immune';
    case C_SICK :
      return C_SICK_COLOR;
    //return 'sick';
    case C_DEAD :
      return C_DEAD_COLOR;
    //return 'dead';
  }
};

/**
 * @param {OffscreenCanvasRenderingContext2D} ctx
 * @param {Cell} cell
 */
const render_cell = (ctx, cell) => {
  ctx.fillStyle = cell_type_str(cell);
  ctx.fillRect(cell.x, cell.y, 1, 1);
};

const render_cells = (ctx, cells) => {
  ctx.beginPath();
  for (let cell of cells) {
    render_cell(ctx, cell)
  }
  ctx.closePath();
};

/**
 * @param {Grid} grid
 * @param ctx
 */
export const render_grid = (grid, ctx) => {
  ctx.beginPath();
  for (let row of grid.rows) {
    for (let cell of row.cells) {
      render_cell(ctx, cell);
    }
  }
  ctx.closePath();
};

const rand = (number) => Math.floor(Math.random() * number);

export class Game {
  get size() {
    return this._size;
  }

  set size(value) {
    this._size = parseInt(value);
  }
  get p_0() {
    return this._p_0;
  }

  set p_0(value) {
    this._p_0 = parseFloat(value);
  }
  get d_0() {
    return this._d_0;
  }

  set d_0(value) {
    this._d_0 = parseFloat(value);
  }
  get sick_time() {
    return this._sick_time;
  }

  set sick_time(value) {
    this._sick_time = parseInt(value);
  }
  get immune_time() {
    return this._immune_time;
  }

  set immune_time(value) {
    this._immune_time = parseInt(value);
  }
  get sick_start() {
    return this._sick_start;
  }

  set sick_start(value) {
    this._sick_start = parseInt(value);
  }
  constructor(canvas, {
    size = 128,
    p_0 = 1 / 3,
    d_0 = 1 / 10,
    sick_start = 1,
    immune_time = 4,
    sick_time = 4,
  }) {
    this.canvas = canvas;
    this._size = size;
    this._p_0 = p_0;
    this._d_0 = d_0;
    this._sick_start = sick_start;
    this._immune_time = immune_time;
    this._sick_time = sick_time;

    this.stats = {};
    this.stats[C_HEALTHY] = size * size;
    this.stats[C_DEAD] = 0;
    this.stats[C_IMMUNE] = 0;
    this.stats[C_SICK] = 0;

    this.grid = {};
  }

  genGrid() {
    this.grid = {rows: []};

    for (let r = 0; r < this._size; r++) {
      const row = {cells: []};

      for (let c = 0; c < this._size; c++) {
        row.cells.push({
          type: C_HEALTHY,
          value: null,
          new_type: null,
          x: r,
          y: c
        })
      }

      this.grid.rows.push(row);
    }
  };

  /**
   * @private
   */
  cellSickPropagation(r, c) {
    const updated = [];

    const size = this._size;

    const r_min = Math.max(0, r - 1);
    const r_max = Math.min(size, r + 2);
    const c_min = Math.max(0, c - 1);
    const c_max = Math.min(size, c + 2);

    for (let _r = r_min; _r < r_max; _r++) {
      for (let _c = c_min; _c < c_max; _c++) {
        const cell = this.grid.rows[_r].cells[_c];

        if (cell.type === C_HEALTHY && this._p_0 > Math.random()) {
          cell.new_type = C_SICK;
          updated.push(cell);
        }
      }
    }

    return updated;
  }

  /**
   * @private
   */
  cellHealthy(cell) {
    this.stats[cell.type]--;
    cell.type = C_HEALTHY;
    cell.value = null;
    this.stats[cell.type]++;
  }

  /**
   * @private
   */
  cellSick(cell) {
    this.stats[cell.type]--;
    cell.type = C_SICK;
    cell.value = this._sick_time;
    this.stats[cell.type]++;
  }

  /**
   * @private
   */
  cellImmune(cell) {
    this.stats[cell.type]--;
    cell.type = C_IMMUNE;
    cell.value = this._immune_time;
    this.stats[cell.type]++;
  }

  /**
   * @private
   */
  cellDead(cell) {
    this.stats[cell.type]--;
    cell.type = C_DEAD;
    cell.value = null;
    this.stats[cell.type]++;
  }

  init() {
    this.canvas.setAttribute('height', this._size);
    this.canvas.setAttribute('width', this._size);

    this.genGrid();

    const ctx = this.canvas.getContext("2d");
    ctx.beginPath();
    ctx.fillStyle = cell_type_str({type: C_HEALTHY});
    ctx.fillRect(0, 0, this._size, this._size);
    ctx.closePath();

    ctx.beginPath();
    for (let i = 0; i < this._sick_start; i++) {
      const cell = this.grid.rows[rand(this._size)].cells[rand(this._size)];
      this.cellSick(cell);

      render_cell(ctx, cell);
    }
    ctx.closePath();
  }

  manage() {
    const size = this._size;

    const updated = [];

    for (let r = 0; r < size; r++) {
      const row = this.grid.rows[r];
      for (let c = 0; c < size; c++) {
        const cell = row.cells[c];

        switch (cell.type) {
          case C_HEALTHY:
          case C_DEAD:
            break;
          case C_IMMUNE:
            cell.value--;
            if (cell.value === 0) {
              cell.new_type = C_HEALTHY;
              updated.push(cell);
            }
            break;
          case C_SICK:
            updated.push(...this.cellSickPropagation(r, c));
            cell.value--;
            if (cell.value === 0) {
              cell.new_type = this._d_0 > Math.random() ? C_DEAD : C_IMMUNE;
              updated.push(cell);
            }
        }
      }
    }

    let r = false;
    const cells_by_types = {};
    cells_by_types[C_HEALTHY] = [];
    cells_by_types[C_DEAD] = [];
    cells_by_types[C_IMMUNE] = [];
    cells_by_types[C_SICK] = [];

    for (let cell of updated) {
      if (cell.new_type) {
        cells_by_types[cell.new_type].push(cell);

        switch (cell.new_type) {
          case C_HEALTHY:
            this.cellHealthy(cell);
            break;
          case C_DEAD:
            this.cellDead(cell);
            break;
          case C_IMMUNE:
            this.cellImmune(cell);
            break;
          case C_SICK:
            this.cellSick(cell);
            break;
        }

        r = true;
        cell.new_type = null;
      }
    }

    const ctx = id('grid').getContext("2d");
    for (let type in cells_by_types) {
      if (cells_by_types[type].length) {
        ctx.beginPath();
        ctx.fillStyle = cell_type_str({type: parseInt(type)});
        for (let cell of cells_by_types[type]) {
          ctx.fillRect(cell.x, cell.y, 1, 1);
        }
        ctx.closePath();
      }
    }

    return r;
  }

  getStats() {
    return {
      healthy: this.stats[C_HEALTHY],
      sick: this.stats[C_SICK],
      immune: this.stats[C_IMMUNE],
      dead: this.stats[C_DEAD]
    }
  }
}
