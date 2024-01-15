import React from 'react';

export class EasterEggGame extends React.Component {

    windowWidth = 400;
    windowHeight = 160;
    blockWidth = 20;
    blockHeight = 20;
    fps = 60;
    speed = 2.5;
    started = false;
    player = new Player(20, 80);
    timers = [];
    items = [];

    constructor(props) {
        super(props);
        this.cols = this.windowWidth / this.blockWidth;
        this.rows = this.windowHeight / this.blockHeight;

        this.canvas = React.createRef();
    }

    componentDidMount() {
        this.ctx = this.canvas.current.getContext('2d');
        this.addEventListener();
    }

    componentDidUpdate() {
        this.ctx = this.canvas.current.getContext('2d');
    }

    render() {
        return (
            <div>
                <canvas ref={this.canvas} style={{width: this.windowWidth, height: this.widnowHeight}} />
            </div>
        );
    }

    start = function () {
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

    pause = function () {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];
        this.started = true;
    }

    reset = function () {
        this.pause();
        setTimeout(() => {
            this.started = false;
            this.player = new Player(20, 80);
            this.timers = [];
            this.items = [];
        }, 0);
    }

    addEventListener = function () {
        this.canvas.current.addEventListener('click', () => {
            if (this.started) {
                this.player.velocity = 0.5;
            } else {
                this.start();
            }
        });
    }

    checkGameover = function () {
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

    moveItems = function () {
        this.items.forEach(item => item.moveLeft(this.speed / this.fps));
    }

    generateBricks = function () {
        let gap = Math.floor(Math.random() * ((this.rows / 2) - 1));
        for (let i = 0; i < this.rows / 2 - gap; i++) {
            this.items.push(new Brick(this.cols - 1, i));
        }
        gap = Math.floor(Math.random() * ((this.rows / 2) - 1));
        for (let i = 0; i < this.rows / 2 - gap; i++) {
            this.items.push(new Brick(this.cols - 1, this.rows - i));
        }
    }

    drawItems = function () {
        this.clearBackground();
        this.items.forEach(item => item.draw(this));
    }

    clearBackground = function () {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);
    }

    drawLine = function (x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    rectCircleColliding = function (cx, cy, rx, ry) {
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

}


class Player {

    static radius = 5;

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
    }

    speedChange = function (acceleration) {
        this.velocity += acceleration;
    }
    
    move = function () {
        this.y -= this.velocity;
    }
    
    draw = function (game) {
        game.ctx.fillStyle = "black";
        game.ctx.strokeStyle = "black";
        game.ctx.beginPath();
        game.ctx.arc(this.x, this.y, Player.radius, 0, Math.PI * 2, false);
        game.ctx.fill();
        game.ctx.closePath();
    }

}



class Brick {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = "black";
    }

    moveLeft = function (amt) {
        this.x = this.x - amt;
    }
    
    draw = function (game) {
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
}