/**
 * @param {Array[][]} world 2d array of tile data
 * @param {Number} startX starting X coordinate of path
 * @param {Number} startY starting Y coordinate of path
 * @param {Number} endX ending X coordinate of path
 * @param {Number} endY ending Y coordinate of path
 */
function findPath(world, startX, startY, endX, endY)
{
	// shortcuts for speed
    let	abs = Math.abs;
	let	max = Math.max;
	let	pow = Math.pow;
	let	sqrt = Math.sqrt;

	let worldWidth = world[0].length;
	let worldHeight = world.length;
	let worldSize =	worldWidth * worldHeight;

	function distance(point, goal)
	{	// diagonals are considered a little farther than cardinal directions
		// diagonal movement using Euclide (AC = sqrt(AB^2 + BC^2))
		// where AB = x2 - x1 and BC = y2 - y1 and AC will be [x3, y3]
		return sqrt(pow(point.x - goal.x, 2) + pow(point.y - goal.y, 2));
	}

    function neighbors(x, y)
	{
		let	north = y - 1;
    	let	south = y + 1;
    	let	east = x + 1;
    	let	west = x - 1;
    	let	isNorthWalkable = north > -1 && isPointWalkable(x, north);
    	let	isSouthWalkable = south < worldHeight && isPointWalkable(x, south);
    	let	isEastWalkable = east < worldWidth && isPointWalkable(east, y);
    	let	isWestWalkable = west > -1 && isPointWalkable(west, y);
    	let	neighborCoords = [];

		if(isNorthWalkable)
            neighborCoords.push({x: x, y: north});
		if(isSouthWalkable)
    		neighborCoords.push({x: x, y: south});
		if(isEastWalkable)
    		neighborCoords.push({x: east, y: y});
		if(isWestWalkable)
    		neighborCoords.push({x: west, y: y});

		diagonalNeighbors(
            isNorthWalkable,
            isSouthWalkable,
            isEastWalkable,
            isWestWalkable,
            north,
            south,
            east,
            west,
            neighborCoords);

		return neighborCoords;
	}

	// returns every available North East, South East,
	// South West or North West cell - no squeezing through
	// "cracks" between two diagonals
	function diagonalNeighbors(
        isNorthWalkable, isSouthWalkable, isEastWalkable, isWestWalkable,
        north, south, east, west, neighborCoords)
	{
		if(isNorthWalkable)
		{
			if(isEastWalkable && isPointWalkable(east, north))
                neighborCoords.push({x: east, y: north});
			if(isWestWalkable && isPointWalkable(west, north))
                neighborCoords.push({x: west, y: north});
		}
		if(isSouthWalkable)
		{
			if(isEastWalkable && isPointWalkable(east, south))
		        neighborCoords.push({x: east, y: south});
			if(isWestWalkable && isPointWalkable(west, south))
                neighborCoords.push({x: west, y: south});
		}
	}

	// Used in the calculatePath function to store route costs, etc.
	function node(parent, point)
	{
		let newNode = {
			parent: parent,
			value: point.x + (point.y * worldWidth), // calc array index
			x: point.x,
			y: point.y,
			f: 0, // heuristic cost
			g: 0 // distance cost
		};

		return newNode;
	}

	// Path function, executes AStar algorithm operations
	function calculatePath()
	{
		// create Nodes from the Start and End x,y coordinates
		let	pathStart = node(null, {x: startX, y: startY});
		let pathEnd = node(null, {x: endX, y: endY});
		let aStar = new Array(worldSize); // init array to specific size
		let openNodes = [pathStart];
		let closedNodes = [];
		let pathCoordinates = [];
		let coordNeighbors;
		let currentNode;
		let path;
		let length;
        let max;
        let min;
        let i;
        let j;

		// iterate through the open list until none are left
		while(length = openNodes.length)
		{
			max = worldSize;
			min = -1;
			for(i = 0; i < length; i++)
			{
				if(openNodes[i].f < max)
				{
					max = openNodes[i].f;
					min = i;
				}
			}

			// grab the next node and remove it from Open array
			currentNode = openNodes.splice(min, 1)[0];

			// is it the destination node?
			if(currentNode.value === pathEnd.value)
			{
				path = closedNodes[closedNodes.push(currentNode) - 1];
				do
				{
					pathCoordinates.push([path.x, path.y]);
				}
				while (path = path.parent);

				// clear arrays
				aStar = [];
                closedNodes = [];
                openNodes = [];

				// flip array
				pathCoordinates.reverse();
			}
			else // not the destination
			{
				// find which nearby nodes are walkable
				coordNeighbors = neighbors(currentNode.x, currentNode.y);

				// test each one that hasn't been tried already
				for(i = 0, j = coordNeighbors.length; i < j; i++)
				{
					path = node(currentNode, coordNeighbors[i]);
					if (!aStar[path.value])
					{
						path.g = currentNode.g +
                            distance(coordNeighbors[i], currentNode);
						path.f = path.g +
                            distance(coordNeighbors[i], pathEnd);
						openNodes.push(path);
						aStar[path.value] = true;
					}
				}

				closedNodes.push(currentNode);
			}
		}
		return pathCoordinates;
	}

	return calculatePath();
}
