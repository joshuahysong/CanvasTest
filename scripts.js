let fieldCanvas;
let fieldCanvasCTX;
let pawnCanvas;
let pawnCanvasCTX;
let statCanvas;
let statCanvasCTX;
let goalCanvas;
let goalCanvasCTX;
let pawn;
let goal;
let tiles = [];
let manualControl = false;
let isLooping = false;

const tileSize = 10; // pixels per tile
const borderColor = "rgba(230, 230, 230, 1)";
const tileTypes = {
    EMPTY: 0,
    PAWN: 1,
    FOOD: 2,
    WALL: 3
};
const tileData = [
    {color: "rgba(238, 238, 238, 1)"}, // EMPTY
    {color: "rgba(255, 0, 0, 1)"}, // PAWN
    {color: "rgba(0, 0, 255, 1)"}, // FOOD
    {color: "rgba(0, 0, 0, 1)"}, // WALL
]


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

    spawnFood();
}

function generateTerrain() {

    let terrainImageData = fieldCanvasCTX.createImageData(
        fieldCanvas.width, fieldCanvas.height);
    let d  = terrainImageData.data;
    let openColor = {r: 238, g: 238, b: 238, a: 255};
    let closedColor = {r: 0, g: 0, b: 0, a: 255};

    let i = 0;
    // For now the world is blank so just populate the tiles object by amount
    for (let x = 0; x < Math.round(fieldCanvas.width / tileSize); x++) {
        tiles[x] = []

        for (var y = 0; y < Math.round(fieldCanvas.height / tileSize); y++) {

            let type = tileTypes.EMPTY;
            if ((x == 0 && y == 0) ||
                (x == 0 && y == 0) ||
                (x == 0 && y == 0) ||
                (x == 0 && y == 0) )
                type = tileTypes.WALL;

            tiles[x][y] = {
                type: tileTypes.EMPTY
            };

            drawTile(x, y);
        }
    }
}

function Pawn(x, y) {
    this.x = x;
    this.y = y;
    this.moveSpeed = 1;
    this.actionSpeed = 200;
    this.food = 200;
    this.maxFood = 200;
    this.viewDistance = 25 * tileSize;
    this.direction = .75;
    this.waitTicks = 0;
    this.huntTime = 0;
    this.viewArc;

    const that = this; // javascript bug for accessing 'this' in private funcs.
    let isHunting = false;

    tiles[x][y].type = tileTypes.PAWN
    drawTile(x, y);

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

function drawTile(x, y) {

    fieldCanvasCTX.fillStyle = tileData[tiles[x][y].type].color;
    fieldCanvasCTX.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    fieldCanvasCTX.strokeStyle = borderColor;
    fieldCanvasCTX.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
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

function spawnFood() {

    let randCoords = getRandomCoords();

    if (randCoords.x == pawn.x ||
        randCoords.y == pawn.y) {
        // Don't spawn the goal on our pawn. Try Again
        spawnFood();
    } else {

        tiles[randCoords.x][randCoords.y].type = tileTypes.FOOD;
        drawTile(randCoords.x, randCoords.y);

        // Create goal
        // id = goalCanvasCTX.createImageData(tileSize, tileSize);
        // d  = id.data;
        // for (var i = 0; i < id.data.length; i += 4) {
        //     d[i+0]   = 0;
        //     d[i+1]   = 0;
        //     d[i+2]   = 255;
        //     d[i+3]   = 255;
        // }
        //
        // goal = {image: id, x: randCoords.x, y: randCoords.y, moveSpeed: 0};
        // goalCanvasCTX.putImageData(id, goal.x, goal.y);
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

    randXY.x = Math.floor(Math.random() *
        Math.round(fieldCanvas.width / tileSize));
    randXY.y = Math.floor(Math.random() *
        Math.round(fieldCanvas.height / tileSize));

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
