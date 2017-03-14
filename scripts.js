let fieldCanvas;
let fieldCanvasCTX;
let pawnCanvas;
let pawnCanvasCTX;
let statCanvas;
let statCanvasCTX;
let pawn = {};
let goal = {};
let isLooping = false;
let isHunting = false;
let tiles = [[]]

function setupCanvasTest() {

    fieldCanvas = document.getElementById("fieldCanvas");
    fieldCanvasCTX = fieldCanvas.getContext("2d");
    pawnCanvas = document.getElementById("pawnCanvas");
    pawnCanvasCTX = pawnCanvas.getContext("2d");
    statCanvas = document.getElementById("statCanvas");
    statCanvasCTX = statCanvas.getContext("2d");

    // Create pixel (This is reportedly significantly faster than fillRect)
    let id = pawnCanvasCTX.createImageData(1,1);
    let d  = id.data;
    for (var i = 0; i < id.data.length; i += 4) {
        d[i+0]   = 255;
        d[i+1]   = 0;
        d[i+2]   = 0;
        d[i+3]   = 255;
    }

    pawn = {
        image: id,
        x: 20,
        y: 20,
        moveSpeed: 1,
        hunger: 100,
        viewDistance: 40,
        viewDirection: .5, // N = 1.5, E = 0, S = .5, W = 1
        searchTime: 0,
        maxSearchTime: 20
    }

    // For now the world is blank so just populate the tiles object by amount
    for (var c = 0; c < fieldCanvas.height; c++) {
        tiles[c] = []
        for (var r = 0; r < fieldCanvas.width; r++) {
            tiles[c][r] = {x: c, y: r, type: 0} // 0 means open
        }
    }

    pawnCanvasCTX.putImageData(id, pawn.x, pawn.y);

    spawnGoal();
}

function drawPawn() {

    // clear layer
    pawnCanvasCTX.clearRect(0, 0, pawnCanvas.width, pawnCanvas.height);
    pawnCanvasCTX.putImageData(pawn.image, pawn.x, pawn.y);

    if (isHunting) {
        // draw view angle
        pawnCanvasCTX.beginPath();
        pawnCanvasCTX.moveTo(pawn.x, pawn.y);
        pawnCanvasCTX.arc(pawn.x, pawn.y, pawn.viewDistance,
            Math.PI * (pawn.viewDirection - .25), Math.PI *(pawn.viewDirection + .25))
        pawnCanvasCTX.lineTo(pawn.x, pawn.y);
        pawnCanvasCTX.fillStyle =  "rgba(255, 255, 0, .5)";
        pawnCanvasCTX.fill();
        pawnCanvasCTX.closePath();
    }
}

function doLoop() {

    adjustBars();
    hunt();
}


function spawnGoal() {

    let randX = Math.floor((Math.random() * fieldCanvas.width) + 1);
    let randY = Math.floor((Math.random() * fieldCanvas.height) + 1);

    if (randX == pawn.x || randY == pawn.y) {
        spawnGoal();
    } else {
        // Create goal pixel
        id = fieldCanvasCTX.createImageData(1,1);
        d  = id.data;
        for (var i = 0; i < id.data.length; i += 4) {
            d[i+0]   = 0;
            d[i+1]   = 0;
            d[i+2]   = 255;
            d[i+3]   = 255;
        }

        goal = {image: id, x: randX, y: randY, moveSpeed: 0};
        oldGoalX = randX;
        oldGoalY = randY;
        fieldCanvasCTX.putImageData(id, goal.x, goal.y);
    }
}

function hunt() {

    if (pawn.hunger == 0) {

        isHunting = true;

        if (pawn.searchTime >= pawn.maxSearchTime) {
            pawn.searchTime = 0
            // Get random direction
            pawn.viewDirection = Math.floor((Math.random() * 4)) / 2

        } else {

            pawn.searchTime += 1
            let dx;
            let dy;

            switch(pawn.viewDirection) {
                case 0: // East
                    dx = 1;
                    dy = 0;
                    break;
                case 0.5: // South
                    dx = 0;
                    dy = 1;
                    break;
                case 1: // West
                    dx = -1;
                    dy = 0;
                    break;
                case 1.5: // North
                    dx = 0;
                    dy = -1;
                    break;
            }

            pawn.x += (dx * pawn.moveSpeed);
            pawn.y += (dy * pawn.moveSpeed);

            // Wall collisions (bounce)
            if (pawn.x >= fieldCanvas.width || pawn.x <= 0) {
                if (pawn.viewDirection == 0) {
                    pawn.viewDirection = 1
                } else if(pawn.viewDirection == 1) {
                    pawn.viewDirection = 0
                };
                //dx = -dx;
                //pawn.x += (dx * pawn.moveSpeed);
            }
            if (pawn.y >= fieldCanvas.height || pawn.y <= 0) {
                if (pawn.viewDirection == 0.5) {
                    pawn.viewDirection = 1.5
                } else if(pawn.viewDirection == 1.5) {
                    pawn.viewDirection = 0.5
                };
                //dy = -dy;
                //pawn.y += (dy * pawn.moveSpeed);
            }
        }

        drawPawn();

    } else {
        drawPawn();
    }
}

function checkPawnSight() {

    var openTiles = []
    var closedTiles = []

    // Get current view perimeter
    // Start at pawn then circle outward checking each tile
    // Tiles must be open and within line of sight
    var startX = pawn.x;
    var startY = pawn.y;


    // Determine if goal is in sight

}

function checkTileLOS() {

}

function getTileType() {

}

function getTileNeighbors(x, y) {
    var neighborTiles
}

function adjustBars() {

    // Hunger bar
    if (pawn.hunger > 0) pawn.hunger -= 1;
    let hungerX = Math.round((pawn.hunger / statCanvas.width) * 100);

    statCanvasCTX.clearRect(0, 0, 100, 5);
    statCanvasCTX.beginPath();
    statCanvasCTX.rect(0, 0, hungerX, 5);
    statCanvasCTX.fillStyle = "rgba(0, 255, 0, 1)";
    statCanvasCTX.fill();
    statCanvasCTX.closePath();
}

function toggleState(button) {
    if (isLooping) {
        button.innerText = "GO";
        clearTimeout(testLoop);
        isLooping = false;
    } else {
        button.innerText = "STOP";
        testLoop = setInterval(doLoop, 20);
        isLooping = true;
    }
}
