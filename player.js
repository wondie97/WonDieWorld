class Player {
    constructor(id, x=100, y=100) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.dir = "down";
        this.color = "#" + Math.floor(Math.random()*16777215).toString(16);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 28, 28);

        ctx.fillStyle = "black";
        ctx.font = "12px sans-serif";
        ctx.fillText("ID:" + this.id, this.x - 5, this.y - 5);
    }
}
