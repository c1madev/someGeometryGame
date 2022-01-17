let tileSideLength = 50                                     // All of the tiles should have the same side length
let canvas = document.getElementById("someGeometryGame")

window.addEventListener("resize", function(){
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}, false);

class TileEdge {
    constructor(orientation, hasConnect) {
        this._orientation = orientation
        this._hasConnect = hasConnect
        this.canAccess = true
        this.isConnected = false
        this.parentTile = null
    }

    getOrientation() {
        return this._orientation
    }

    hasConnect() {
        return this._hasConnect
    }

    isDiagonal() {
        return (this.orientation ==4 || (this.orientation%5)%2 == 1)
    }

    rotate(rotateBy) {
        rotateBy = ((rotateBy%8)+8)%8 // breaking down every Input to be positive and < 8
        this.orientation = Math.sign(this._orientation-3.4) * ((abs(rotateBy -3.5) -Math.trunc(rotateBy /4) *4) +3.5)
    }
}

class Segment {
    constructor(ends) {
        this._ends = ends
        this.open = true
        this.parentTile = null
    }
    
    getEnds() {
        return this.ends
    }
}

class Pathway {
    constructor(firstSegment) {
        this._segments = []
        this._segments.push(firstSegment)
        this._openEnds = []
        this._openEnds.push(this._segments[0].getEnds())
    }

    getSegments() {
        return this._segments
    }

    getOpenEnds() {
        return this._openEnds
    }

    getSegmentEnds() { //necessary?
        let ends = []
        this._segments.forEach( segment => {
            ends.push(segment.getEnds())
        })
    }
}

class Tile{
    constructor(edges, pathSegments) {
        this._edges = edges
        this._pathSegments = pathSegments
        this._mainConnect = null
    }

    getEdges = () => {
        return this._edges
    }

    getSegments = () => {
        return this._pathSegments
    }

    getMainConnect = () => {
        return this._mainConnect
    }

    setMainConnect = (tileEdge) => {
        if (this._mainConnect == null) {
            this._mainConnect = tileEdge
            return true
        } else {
            return false
        }
    }

    rotate = (steps) => {
        this.edges.forEach(edge => {
            edge.rotate(steps)
        })
    }
}

class sqrTile extends Tile{
    constructor(edges, pathSegments) {
        super(edges.slice(0,4), pathSegments)
    }
}

class hexTile extends Tile{
    constructor(edges, pathSegments){
        super(edges.slice(0,6), pathSegments)
    }
}

class board {
    constructor(edges, pathways) {
        this._edges = edges
        this._accessibleEdges = edges
        this._pathways = pathways
        this._unfinishedPathways = pathways
    }

    getEdges() {
        return this._edges
    }

    getPathways() {
        return this._pathways
    }

    getAccessibleEdges() {
        return this._accessibleEdges
    }

    getUnfinishedPathways() {
        return this._unfinishedPathways
    }

    addTile(tileToAdd, connectionEdge) {
        this._edges.push(tileToAdd.getEdges())
        tileToAdd.setMainConnect(connectionEdge) // lots to do
        
    }

    _addPathway(pathway) {
        this._pathways.push(pathway)
        this._unfinishedPathways.push(pathway)
    }
}