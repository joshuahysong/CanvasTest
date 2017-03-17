let fieldCanvas;
let fieldCanvasCTX;
let pawnCanvas;
let pawnCanvasCTX;
let statCanvas;
let statCanvasCTX;
let goalCanvas;
let goalCanvasCTX;
let pawn = {};
let goal = {};
let isLooping = false;
let tiles = [];
let manualControl = false;
const tileSize = 1; // pixels per tile

function setupCanvasTest() {

    fieldCanvas = document.getElementById("fieldCanvas");
    fieldCanvasCTX = fieldCanvas.getContext("2d");
    pawnCanvas = document.getElementById("pawnCanvas");
    pawnCanvasCTX = pawnCanvas.getContext("2d");
    statCanvas = document.getElementById("statCanvas");
    statCanvasCTX = statCanvas.getContext("2d");
    goalCanvas = document.getElementById("goalCanvas");
    goalCanvasCTX = goalCanvas.getContext("2d");

    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);

    generateTerrain();

    // Create pawn
    let randCoords = getRandomCoords();
    pawn = new Pawn(randCoords.x, randCoords.y);

    //spawnGoal();
}

function generateTerrain() {

    let terrainImageData = fieldCanvasCTX.createImageData(
        fieldCanvas.width, fieldCanvas.height);
    let d  = terrainImageData.data;
    let openColor = {r: 238, g: 238, b: 238, a: 255};
    let closedColor = {r: 0, g: 0, b: 0, a: 255};

    let i = 0;
    // For now the world is blank so just populate the tiles object by amount
    for (let r = 0; r < fieldCanvas.width; r++) {
        tiles[r] = []

        for (var c = 0; c < fieldCanvas.height; c++) {

            let type = 0;

            if (r >= 20 && r <= 80 && c >= 40 && c <= 60)
                type = 1;

            tiles[r][c] = {x: c, y: r, type: type} // 0 means open
            let colorData = (type == 0) ? openColor : closedColor;
            d[i+0] = colorData.r;
            d[i+1] = colorData.g;
            d[i+2] = colorData.b;
            d[i+3] = colorData.a;

            i += 4;
        }
    }

    fieldCanvasCTX.putImageData(terrainImageData, 0, 0);
}

function Pawn(x, y) {
    this.image;
    this.x = x;
    this.y = y;
    this.moveSpeed = 1;
    this.actionSpeed = 10;
    this.food = 200;
    this.maxFood = 200;
    this.viewDistance = 50;
    this.direction = .75;
    this.waitTicks = 0;
    this.huntTime = 0;
    this.viewArc;

    const that = this; // javascript bug for accessing 'this' in private funcs.
    let isHunting = false;

    create();
    draw();

    function create() {

        let id = pawnCanvasCTX.createImageData(1,1);
        let d  = id.data;
        for (var i = 0; i < id.data.length; i += 4) {
            d[i+0] = 255;
            d[i+1] = 0;
            d[i+2] = 0;
            d[i+3] = 255;
        }

        that.image = id;
    }

    function draw() {

        // clear layer
        pawnCanvasCTX.clearRect(0, 0, pawnCanvas.width, pawnCanvas.height);
        pawnCanvasCTX.putImageData(that.image, that.x, that.y);
        setViewArc();

        if (isHunting) {

            // draw view angle
            pawnCanvasCTX.beginPath();
            pawnCanvasCTX.moveTo(that.x, that.y);
            pawnCanvasCTX.arc(
                that.viewArc.x,
                that.viewArc.y,
                that.viewArc.radius,
                that.viewArc.startAngle,
                that.viewArc.endAngle)
            pawnCanvasCTX.lineTo(that.x, that.y);
            pawnCanvasCTX.fillStyle = "rgba(255, 255, 0, .5)";
            pawnCanvasCTX.fill();
            pawnCanvasCTX.closePath();
        }
    }
    // N = 1.5, E = 0, S = .5, W = 1
    this.setDirection = function(direction)
    {
        this.direction = direction;
    }

    function setViewArc() {

        that.viewArc = {
            x: that.x,
            y: that.y,
            radius: that.viewDistance,
            startAngle: Math.PI * (that.direction - .25),
            endAngle: Math.PI *(that.direction + .25)
        }
    }

    this.think = function() {

        this.waitTicks++;

        if (this.waitTicks >= this.actionSpeed) {
            this.waitTicks = 0;
            this.food--; // Reduce hunger by 1 each action.
            if (this.food < 0) this.food = 0;
            let foodX = Math.round((
                (this.food / this.maxFood) *
                statCanvas.width));

            statCanvasCTX.clearRect(0, 0,
                statCanvas.width, statCanvas.height);
            statCanvasCTX.beginPath();
            statCanvasCTX.rect(0, 0, foodX, 5);
            statCanvasCTX.fillStyle = "rgba(0, 255, 0, 1)";
            statCanvasCTX.fill();
            statCanvasCTX.closePath();

            hunt();
        }
    }

    this.move = function()
    {
        // calculate the next tile along the angle
        var theta = this.direction * Math.PI;

        // MATHMAGICAL!
        dx = Math.cos(theta) * tileSize;
        dy = Math.sin(theta) * tileSize;

        if (collisionDetection()) {
            console.log('collided')
            this.direction = getRandomDirection();

        } else {

            this.x += (dx * this.moveSpeed);
            this.y += (dy * this.moveSpeed);
        }

        draw();
    }

    function hunt() {
        isHunting = true;

        if (isGoalSeen()) {

            // We see the goal!
            // Head straight towards it using the power of MATH
            var tx = goal.x - that.x,
                ty = goal.y - that.y,
                dist = Math.sqrt(tx*tx+ty*ty),
                rad = Math.atan2(ty,tx);

            // if we are mathematically within 1 of the goal then
            // jump to it, otherwise it's often missed.
            if (dist < 1) {
                dx = 0;
                dy = 0;

                that.x = goal.x;
                that.y = goal.y;
                eat();
            }

            // change pawns view to match his movement direction
            that.direction = rad/Math.PI;

        } else {

            that.huntTime++;
            // Get a random direction to search every X Ticks
            if (that.huntTime >= 50) {
                that.huntTime = 0;
                that.direction = getRandomDirection();
            }
        }

        that.move();
    }

    function eat() {
        that.food = that.maxFood;
        spawnGoal();
    }
}

function collisionDetection() {

    let hasCollided = false;

    // Border collision
    if (pawn.x > fieldCanvas.width - 1) {
        pawn.x = fieldCanvas.width - 1;
        hasCollided = true;
    }
    if (pawn.x < 0) { pawn.x = 0; hasCollided = true; }
    if (pawn.y > fieldCanvas.height - 1) {
        pawn.y = fieldCanvas.height - 1;
        hasCollided = true;
    }
    if (pawn.y < 0) { pawn.y = 0; hasCollided = true };

    // Wall collision

    // THIS DOESN"T WORK RIGHT NOW DUE TO X AND Y BEING FRACTIONAL
    //if (isPointBlocked(pawn.x, pawn.y))
    //    hasCollided = true;

    return hasCollided
}

function updatePawns() {

    if (manualControl) {
        pawn.move();
    } else {
        pawn.think();
    }
}

function doLoop() {
    updatePawns()
}

function spawnGoal() {

    let randCoords = getRandomCoords();

    if (randCoords.x == pawn.x ||
        randCoords.y == pawn.y) {
        // Don't spawn the goal on our pawn. Try Again
        spawnGoal();
    } else {

        // clear previous goal if any
        goalCanvasCTX.clearRect(0, 0, goalCanvas.width, goalCanvas.height);

        // Create goal
        id = goalCanvasCTX.createImageData(1,1);
        d  = id.data;
        for (var i = 0; i < id.data.length; i += 4) {
            d[i+0]   = 0;
            d[i+1]   = 0;
            d[i+2]   = 255;
            d[i+3]   = 255;
        }

        goal = {image: id, x: randCoords.x, y: randCoords.y, moveSpeed: 0};
        goalCanvasCTX.putImageData(id, goal.x, goal.y);
    }
}

function isGoalSeen() {

    pawnCanvasCTX.beginPath();
    pawnCanvasCTX.moveTo(pawn.viewArc.x, pawn.viewArc.y);
    pawnCanvasCTX.arc(pawn.viewArc.x, pawn.viewArc.y,
        pawn.viewArc.radius, pawn.viewArc.startAngle,
        pawn.viewArc.endAngle);
    pawnCanvasCTX.lineTo(pawn.viewArc.x, pawn.viewArc.y);

    var isSeen = pawnCanvasCTX.isPointInPath(goal.x, goal.y);

    pawnCanvasCTX.closePath();

    return isSeen;
}

function getRandomCoords() {
    var randXY = {x:0, y:0}

    randXY.x = Math.floor(Math.random() * fieldCanvas.width);
    randXY.y = Math.floor(Math.random() * fieldCanvas.height);

    if (isPointBlocked(randXY.x, randXY.y))
        return getRandomCoords();

    return randXY;
}

function getRandomDirection() {
    return Math.random() * 4;
}

function isPointBlocked(x, y) {

    if (tiles[y][x].type == 1)
        return true;
    return false;
}

function toggleState(button) {
    if (isLooping) {
        button.innerText = "GO";
        clearTimeout(testLoop);
        isLooping = false;
    } else {
        button.innerText = "STOP";
        testLoop = setInterval(doLoop, 1);
        isLooping = true;
    }
}

function keyDownHandler(e) {
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        //switch(e.keyCode)
    }
}

function keyUpHandler(e) {
    if (e.keyCode == 39) {
        rightPressed = false;
    } else if (e.keyCode == 37) {
        leftPressed = false;
    }
}
