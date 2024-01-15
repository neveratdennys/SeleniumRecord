/**
 * 
 * Easter egg game for extension
 * 
 * To use this
 * import the script into pop-up.html, <script src="js/easteregg.js"></script>
 * and add canvas to the bottom of body div, <canvas id="canvas" width="400px" height="160px"></canvas>
 */

$(document).ready(function () {new Game();});

class Game {

    constructor() {
      this.windowWidth = 400;
      this.windowHeight = 160;
      this.blockWidth = 20;
      this.blockHeight = 20;
      this.cols = this.windowWidth / this.blockWidth;
      this.rows = this.windowHeight / this.blockHeight;
  
      this.fps = 60;
      this.speed = 2.5;
  
      this.canvas = document.querySelector('canvas[id=canvas]');
      this.ctx = canvas.getContext('2d');
  
      this.started = false;
      this.player = new Player(20, 80);
      this.timers = [];
      this.items = [];      
      this.addEventListener();
    }
  
  }
  
  Game.prototype.start = function () {
    this.started = true;
    this.timers.push(setInterval(() => {
      this.moveItems();
      this.player.speedChange(-0.5 / this.fps);
      this.player.move();
      this.checkGameover();
      this.drawItems();
      this.player.draw(this);
    }, 1 / this.fps));
    this.timers.push(setInterval(() => this.generateBricks(), 1000));
  }
  
  Game.prototype.pause = function () {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];
    this.started = true;
  }
  
  Game.prototype.reset = function () {
    this.pause();
    setTimeout(() => {
      this.started = false;
      this.player = new Player(20, 80);
      this.timers = [];
      this.items = [];
    }, 0);
  }
  
  Game.prototype.addEventListener = function () {
    this.canvas.addEventListener('click', () => {
      if (this.started) {
        this.player.velocity = 0.5;
      } else {
        this.start();
      }
    });
  }
  
  Game.prototype.checkGameover = function () {
    if (this.player.y > this.windowHeight) {
      this.reset();
    }
    this.items.forEach((item) => {
      const collided = this.rectCircleColliding(this.player.x, this.player.y, item.x * this.blockWidth, item.y * this.blockHeight);
      if (collided) {
        item.color = "red";
        this.reset();
      }
    });
  }
  
  Game.prototype.moveItems = function () {
    this.items.forEach(item => item.moveLeft(this.speed / this.fps));
  }
  
  Game.prototype.generateBricks = function () {
    let gap = Math.floor(Math.random() * ((this.rows / 2) - 1));
    for (let i = 0; i < this.rows / 2 - gap; i++) {
      this.items.push(new Brick(this.cols - 1, i));
    }
    gap = Math.floor(Math.random() * ((this.rows / 2) - 1));
    for (let i = 0; i < this.rows / 2 - gap; i++) {
      this.items.push(new Brick(this.cols - 1, this.rows - i));
    }
  }
  
  Game.prototype.drawItems = function () {
    this.clearBackground();
    this.items.forEach(item => item.draw(this));
  }
  
  Game.prototype.clearBackground = function () {
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);
  }
  
  Game.prototype.drawLine = function (x1, y1, x2, y2) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }
  
  Game.prototype.rectCircleColliding = function (cx, cy, rx, ry) {
    var distX = Math.abs(cx - rx - this.blockWidth / 2);
    var distY = Math.abs(cy - ry - this.blockHeight / 2);
  
    if (distX > (this.blockWidth / 2 + Player.radius)) { return false; }
    if (distY > (this.blockHeight / 2 + Player.radius)) { return false; }
  
    if (distX <= (this.blockWidth / 2)) { return true; }
    if (distY <= (this.blockHeight / 2)) { return true; }
  
    var dx = distX - this.blockWidth / 2;
    var dy = distY - this.blockHeight / 2;
    return (dx * dx + dy * dy <= (Player.radius * Player.radius));
  }
  
  class Player {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.velocity = 0;
    }
  }
  
  Player.radius = 5;
  
  Player.prototype.speedChange = function (acceleration) {
    this.velocity += acceleration;
  }
  
  Player.prototype.move = function () {
    this.y -= this.velocity;
  }
  
  Player.prototype.draw = function (game) {
    game.ctx.fillStyle = "black";
    game.ctx.strokeStyle = "black";
    game.ctx.beginPath();
    game.ctx.arc(this.x, this.y, Player.radius, 0, Math.PI * 2, false);
    game.ctx.fill();
    game.ctx.closePath();
  }
  
  class Brick {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.color = "black";
    }
  }
  
  Brick.prototype.moveLeft = function (amt) {
    this.x = this.x - amt;
  }
  
  Brick.prototype.draw = function (game) {
    game.ctx.strokeStyle = this.color;
    game.ctx.strokeRect(this.x * game.blockWidth, this.y * game.blockHeight, game.blockWidth, game.blockHeight);
  
    const gap = 0.25;
  
    for (let i = 0; i < 1; i += gap) {
      game.drawLine(this.x * game.blockWidth, (this.y + i) * game.blockHeight, (this.x + 1) * game.blockWidth, (this.y + i) * game.blockHeight);
      if (i / gap % 2 !== 0) {
        game.drawLine((this.x + 0.5) * game.blockWidth, (this.y + i) * game.blockHeight, (this.x + 0.5) * game.blockWidth, (this.y + i + gap) * game.blockHeight);
      } else {
        game.drawLine((this.x + 0.33) * game.blockWidth, (this.y + i) * game.blockHeight, (this.x + 0.33) * game.blockWidth, (this.y + i + gap) * game.blockHeight);
        game.drawLine((this.x + 0.66) * game.blockWidth, (this.y + i) * game.blockHeight, (this.x + 0.66) * game.blockWidth, (this.y + i + gap) * game.blockHeight);
      }
    }
  }
  
  