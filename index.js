
function *range(begin, end) {
    for (let i = begin; i < end; i++) {
        yield i;
    }
}

function getCssVariable(name) {
    return window.getComputedStyle(document.body).getPropertyValue(name);
}

function getCssVariableAsNumber(name) {
    return parseInt(getCssVariable(name), 10);
}

function shuffle(array) {
    for (let i = 0; i < array.length - 1; i++) {
        let otherIndex = i + Math.floor(Math.random() * (array.length - 1 - i));
        let position = array[i];
        array[i] = array[otherIndex];
        array[otherIndex] = position;
    }
}

class Domino {

    /**
     * @param {Number} index
     * @param {Dominoes} app
     * @param {Number} x1
     * @param {Number} y1
     * @param {Number} x2
     * @param {Number} y2
     */
    constructor (index, app, x1, y1, x2, y2) {
        this.index = index;
        this.app = app;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.element = document.createElement("div");
        const rotationClass = x1 < x2 ? "east" : "south";
        this.element.classList.add("domino", rotationClass);
        const canvasX = x1 * app.tileSize + app.tilePadding;
        const canvasY = y1 * app.tileSize + app.tilePadding;
        this.element.style.top = `${canvasY}px`;
        this.element.style.left = `${canvasX}px`;

        this.app.container.appendChild(this.element);

        this.element.addEventListener("click", () => {
            this.app.removeDomino(this.index);
            this.remove();
        });
    }

    remove() {
        this.element.remove();
    }
}

class RandomPlacement {

    constructor () {
        this.NEIGHBOR_EAST = { dx: 1, dy: 0 };
        this.NEIGHBOR_SOUTH = { dx: 0, dy: 1 };
        this.NEIGHBOR_WEST = { dx: -1, dy: 0 };
        this.NEIGHBOR_NORTH = { dx: 0, dy: -1 };

        /** @type {Boolean[][]} */
        this.board = [];
        this.boardWidth = 0;
        this.boardHeight = 0;
        this.boardPositions = [];
    }

    resetBoard(width, height) {
        if (this.boardWidth !== width || this.boardHeight !== height) {
            this.boardWidth = width;
            this.boardHeight = height;
            this.board = Array.from(Array(this.boardWidth), () => Array(this.boardHeight));

            // generate all pairs corresponding to board positions in the form [x, y]
            const totalTiles = width * height;
            this.boardPositions = Array.from(Array(totalTiles), (e, i) => {
                const y = Math.trunc(i / width);
                const x = i % height;
                return [x, y];
            });
        }

        for (const y of range(0, height)) {
            for (const x of range(0, width)) {
                this.board[x][y] = false;
            }
        }
    }

    /**
     * Runs a single placement.
     *
     * @param {Number} width
     * @param {Number} height
     * @returns {[Number, Number][]} sequence of pairs of coordinates where each domino is
     */
    run(width, height) {
        this.resetBoard(width, height);

        /** @type {[Number, Number][]} */
        let result = [];

        // cannot just start from position [0,0], otherwise we'll bias the result ([0,0] would always contain a domino)
        shuffle(this.boardPositions);

        for (const [x, y] of this.boardPositions) {
            if (this.board[x][y]) {
                continue;  // there's a domino there already
            }

            /** @type {{dx: Number, dy: Number}[]} */
            let availableNeighborTiles = [];
            // check all possible placements starting from where we are
            if ((x + 1) < width && !this.board[x + 1][y]) {
                availableNeighborTiles.push(this.NEIGHBOR_EAST);
            }
            if ((y + 1) < height && !this.board[x][y + 1]) {
                availableNeighborTiles.push(this.NEIGHBOR_SOUTH);
            }
            if (x > 0 && !this.board[x - 1][y]) {
                availableNeighborTiles.push(this.NEIGHBOR_WEST);
            }
            if (y > 0 && !this.board[x][y - 1]) {
                availableNeighborTiles.push(this.NEIGHBOR_NORTH);
            }

            if (availableNeighborTiles.length === 0) {
                continue;  // no placements available
            }

            const randomNeighborIndex = Math.trunc(Math.random() * availableNeighborTiles.length);
            const chosenNeighborTile = availableNeighborTiles[randomNeighborIndex];

            // occupy board positions
            this.board[x][y] = true;
            this.board[x + chosenNeighborTile.dx][y + chosenNeighborTile.dy] = true;

            // smaller position goes first so that dominoes are always west->east or north->south
            if (chosenNeighborTile.dx < 0 || chosenNeighborTile.dy < 0) {
                result.push([x + chosenNeighborTile.dx, y + chosenNeighborTile.dy]);
                result.push([x, y]);
            } else {
                result.push([x, y]);
                result.push([x + chosenNeighborTile.dx, y + chosenNeighborTile.dy]);
            }
        }

        return result;
    }
}

class Dominoes {

    constructor () {
        this.container = document.getElementById("board");
        this.canvas = /** @type{HTMLCanvasElement} */ document.getElementById("board-background");
        this.canvas.setAttribute("width", getComputedStyle(this.canvas).getPropertyValue("width"));
        this.canvas.setAttribute("height", getComputedStyle(this.canvas).getPropertyValue("height"));
        this.context = this.canvas.getContext("2d");

        this.tileSize = getCssVariableAsNumber("--tile-size");
        this.tilePadding = getCssVariableAsNumber("--tile-padding");
        this.boardWidth = getCssVariableAsNumber("--board-width");
        this.boardHeight = getCssVariableAsNumber("--board-height");

        this.drawGrid();

        this.randomPlacement = new RandomPlacement();

        this.runRandomPlacement();

        document.addEventListener("keypress", e => e.key === "r" && this.runRandomPlacement());
        document.addEventListener("keypress", e => e.key === "c" && this.reset());
        document.getElementById("reset").addEventListener("click", () => this.runRandomPlacement());
        document.getElementById("clear").addEventListener("click", () => this.reset());
    }

    reset() {
        if (!this.dominoesById) {
            /** @type {Map<Number, Domino>} */
            this.dominoesById = new Map();
        } else if (this.dominoesById) {
            for (const domino of this.dominoesById.values()) {
                domino.remove();
            }
            this.dominoesById.clear();
        }

        /** @type {Domino[][]} */
        this.board = Array.from(Array(this.boardWidth), () => Array(this.boardHeight));
    }

    runRandomPlacement() {
        this.reset();

        const totalTiles = this.boardWidth * this.boardHeight;
        let bestPlacement = [];
        for (let i = 0; i < 10000; i++) {
            const placement = this.randomPlacement.run(this.boardWidth, this.boardHeight);
            if (placement.length > bestPlacement.length) {
                bestPlacement = placement;
            }
            if (placement.length === totalTiles) {
                break;
            }
        }

        let nextDominoIndex = 1;
        for (let i = 0; i < bestPlacement.length; i += 2) {
            const [x1, y1] = bestPlacement[i];
            const [x2, y2] = bestPlacement[i+1];
            this.addDomino(nextDominoIndex++, x1, y1, x2, y2);
        }
    }

    addDomino(index, x1, y1, x2, y2) {
        const domino = new Domino(index, this, x1, y1, x2, y2);
        this.board[x1][y1] = domino;
        this.board[x2][y2] = domino;
        this.dominoesById.set(index, domino);
    }

    removeDomino(index) {
        const domino = this.dominoesById.get(index);
        this.board[domino.x1][domino.y1] = undefined;
        this.board[domino.x2][domino.y2] = undefined;
        this.dominoesById.delete(index);

    }

    drawGrid() {
        this.context.beginPath();
        this.context.strokeStyle = "#acacac";
        for (const y of range(0, this.boardHeight)) {
            for (const x of range(0, this.boardWidth)) {
                this.context.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            }
        }
        this.context.closePath();
    }
}

window.addEventListener("load", () => new Dominoes());
