let sqrSideLength = 40                                     // All of the tiles should have the same side length
let frameWidth = 3
let hexSideLength = sqrSideLength+0.5*frameWidth*(1-Math.tan(22.5*Math.PI/180))          //but the frame breaks everything, so that‘s why here are tile-specific side length
let octSideLength = sqrSideLength+frameWidth*(1-Math.tan(22.5*Math.PI/180))
let hexConnectOffset = (octSideLength-hexSideLength)/2     //Due to the upper and lower Edges of the hex tiles having different angles at each corner, the connect is not the center
let canvas = document.getElementById("someGeometryGame")
let debug = false
document.body.style.background = "rgb(101, 104, 121)";

window.addEventListener("resize", function(){
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}, false);

document.oncontextmenu = () => {
    return false;
}

class LocalEventEmitter {
    constructor() {
        this._events = {};
    }

    on(evt, listener) {
        (this._events[evt] || (this._events[evt] = [])).push(listener);
        return this;
    }

    emit(evt, arg) {
        (this._events[evt] || []).slice().forEach(lsn => lsn(arg));
    }
}


// model
class TileEdge {
    constructor(hasConnect, rotationLeft) {
        this._orientation = 0
        this.rotate(rotationLeft)
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
        return (this._orientation ==4 || (this._orientation%5)%2 == 1)
    }

    getOrientation() {
        return this._orientation
    }

    rotate(rotateBy) {
        let functionX = (((rotateBy)%8)+8)%8        // breaking down every Input to be positive and < 8
		functionX += Math.abs(this._orientation-Math.floor((this._orientation/8)+0.5)*8) + Math.floor((this._orientation%8)/4)*3 // finding the correct offset for function
        this._orientation = Math.abs(functionX-Math.floor((functionX/8)+0.5)*8) + Math.floor((functionX%8)/4)*3
    }
}

class Segment {
    constructor(ends) {
        this._ends = ends
        this.open = true
        this.parentTile = null
    }
    
    getEnds() {
        return this._ends
    }

    boardSort(board) {
        let bEdges = board.getEdges()
        let length = this._ends.length
        if(length != 1) {
            let d = 8+bEdges.indexOf(this._ends[0]) - bEdges.indexOf(this._ends[length-1]), iSplice = 0;
            for(let c = 1, i = bEdges.indexOf(this._ends[0]), iPlus1 /* = bEdges.indexOf(this._ends[1])*/; c < length; c++) {
                iPlus1 = bEdges.indexOf(this._ends[c])
                if(iPlus1 - i > d) {
                    d = iPlus1-i;
                    iSplice = c;
                }
                i = iPlus1
            }
            let sortedEnds = this._ends.splice(iSplice)
            this._ends = sortedEnds.concat(this._ends)
        }
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
        this._edges.forEach(edge => {
            edge.parentTile = this
        })

        this._pathSegments = []
        for(let x = 0; x < pathSegments.length; x++) {
            let segmentEnds = []
            pathSegments[x].forEach(edge => {
                if(this._edges.indexOf(edge) != -1) segmentEnds.push(edge)
            })
            this._pathSegments.push(new Segment(segmentEnds))
            this._pathSegments[this._pathSegments.length-1].parentTile = this
        }
        this._originalConnects = null
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

    setOriginalConnects = (args) => {
        if (!this._originalConnects) {
            this._originalConnects = args
            return true
        }
        return false
    }

    rotate = (steps) => {
        this._edges.forEach(edge => {
            edge.rotate(steps)
        })
    }
}

class SqrTile extends Tile{
    constructor(edges, pathSegments) {
        super(edges.slice(0,4), pathSegments)
    }
}

class HexTile extends Tile{
    constructor(edges, pathSegments){
        super(edges.slice(0,6), pathSegments)
    }
}

class Board {
    constructor(edges, pathways) {
        this._edges = edges
        this._accessibleEdges = edges.slice()
        this._pathways = pathways
        this._pathways.forEach(p => {
            p.getSegments()[0].boardSort(this)
        })
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

    addTile(tileToAdd, edges) {
        let fits = false
        let tileEdges = tileToAdd.getEdges().slice()
        edges.forEach(edge => {
            if(tileEdges[edge.t].getOrientation() + this._accessibleEdges[edge.b].getOrientation() == 7) fits = true
        })
        if(!fits) return false

        this._edges.push(...tileToAdd.getEdges())
        tileEdges = tileEdges.concat(tileEdges)
        let eLen = edges.length
        for(let c = 0; c < eLen; c++) {
            this._accessibleEdges[edges[c].b].canAccess = false
            tileToAdd.getEdges()[edges[c].t].canAccess = false

            this._accessibleEdges.splice(edges[c].b, 1, ...tileEdges.slice(edges[c].t+1,
                (edges[c].t < edges[(c+1)%eLen].t) ? edges[(c+1)%eLen].t : edges[(c+1)%eLen].t+tileEdges.length/2))
        }
        tileToAdd.setOriginalConnects(edges)
        return true
    }

    _addPathway(pathway) {
        this._pathways.push(pathway)
        this._unfinishedPathways.push(pathway)
    }
}


// graphics
class TeamColor {
    constructor(r, g, b) {
        this._r = r
        this._g = g
        this._b = b
    }

    getColorValues() {
        return {r:this._r, g:this._g, b:this._b}
    }

    getPathColor() {
        return `rgb(${this._r/2},${this._g/2},${this._b/2})`
    }

    getBaseColor() {
        return `rgb(${Math.ceil(this._r/5)+150},${Math.ceil(this._g/5)+150},${Math.ceil(this._b/5)+150})`
    }

    getSelectPathColor() {
        return `rgb(${this._r/1.2},${this._g/1.2},${this._b/1.2})`
    }

    getSelectBaseColor() {
        return `rgb(${Math.ceil(this._r/5)+170},${Math.ceil(this._g/5)+170},${Math.ceil(this._b/5)+170})`
    }

    getFrameTopColor() {
        return `rgb(${Math.ceil(this._r/5)+200},${Math.ceil(this._g/5)+200},${Math.ceil(this._b/5)+200})`
    }
    
    getFrameBotColor() {
        return `rgb(${Math.ceil(this._r/5)+100},${Math.ceil(this._g/5)+100},${Math.ceil(this._b/5)+100})`
    }
}

class GTile {
    constructor(teamColor, type) {
        this._type = type

        this._teamColor = teamColor

        this._base = new Path()
        this._base.closed = true
        this._base.fillColor = teamColor.getBaseColor()

        this._frameTop = new CompoundPath()
        this._frameTop.strokeColor = teamColor.getFrameTopColor()
        this._frameTop.closed = true

        this._frameBot = new CompoundPath()
        this._frameBot.strokeColor = teamColor.getFrameBotColor()
        this._frameBot.closed = true

        this._frame = new Group(this._frameTop, this._frameBot)
        this._frame.fillColor = teamColor.getBaseColor()
        this._frame.strokeWidth = frameWidth
        this._frame.strokeCap = "round"
        this._frame.strokeJoin = "round"

        this._pattern = new CompoundPath()
        this._pattern.strokeColor = teamColor.getPathColor()
        this._pattern.strokeWidth = 4
        this._pattern.strokeCap = "round"
        this._pattern.strokeJoin = "round"

        this._graphics = new Group([this._base,this._frame,this._pattern])

        this._edges = []

        this._rotation = 0
        this._movable = false
        this._slot = null
        this._initialiseMouseEvents()
    }

    on(evt, arg) {
        this._graphics.on(evt, arg)
    }

    toBack() {
        this._graphics.sendToBack()
    }

    toFront() {
        this._graphics.bringToFront()
    }

    getRotation() {
        return this._rotation
    }

    getCenter() {
        return this._graphics.position
    }

    getBase() {
        return this._base
    }

    getEdges() {
        return this._edges
    }

    getType() {
        return this._type
    }

    setPosition(point) {
        this._graphics.setPosition(point)
    }

    setSlot(slot) {
        this._slot = slot
    }

    rotate(steps) {
        steps = steps%8
        if(steps < 0) for(let c = 0; c < Math.abs(steps); c++){
            this._rotateLeft()
            this._rotation = (this._rotation + 7) % 8
        } else if(steps > 0) for(let c = 0; c < steps; c++) {
            this._rotateRight()
            this._rotation = (this._rotation + 1) % 8
        }
        this._graphics.emit("rotate", steps)
    }

    _rotateLeft() {}

    _rotateRight() {}

    _initialiseMouseEvents() {
        this._graphics.onMouseEnter = (event) => {
            this._base.fillColor = this._teamColor.getSelectBaseColor()
            this._pattern.strokeColor = this._teamColor.getSelectPathColor()
        }

        this._graphics.onMouseLeave = (event) => {
            this._base.fillColor = this._teamColor.getBaseColor()
            this._pattern.strokeColor = this._teamColor.getPathColor()
        }

        this._graphics.onMouseDrag = (event) => {
            if(this._movable){
                this._graphics.position.x += event.delta.x;
                this._graphics.position.y += event.delta.y;
                this._slot = null;
            }
        }

        this._graphics.onClick = (event) => {
            if(this._movable){
                if(Math.abs(event.delta.x)+Math.abs(event.delta.y) == 0){
                    if(event.button == 0) { // event.button is not in the original paper.js, added it because I needed to identify right and left click
                        
                    }else if(event.button == 2) {
                        
                    }
                }
                this._graphics.emit("moveClick", this)
                this._graphics.emit("needSlots", this)
            } else {
                this._graphics.emit("fixedClick", this)
            }
        }

        this._graphics.onMouseDown = event => {
            if(this._movable){
                this._graphics.emit("needSlots", this)
                this._graphics.emit("activated", this)
            }
        }

        // the MouseWheel events are not originally in the paper.js
        this._graphics.onMouseWheel = (event) => {
            if(this._movable) {
                this._graphics.emit("activated", this)
                this._graphics.emit("needSlots",this)
                this._slot = null
            }
        }

        this._graphics.onMouseWheelFore = (event) => {
            if(this._movable){
                this._rotateLeft()
                this._rotation = (this._rotation + 7) % 8
                this._graphics.emit("rotate", -1)
            }
        }

        this._graphics.onMouseWheelBack = (event) => {
            if(this._movable){
                this._rotateRight()
                this._rotation = (this._rotation + 1) % 8
                this._graphics.emit("rotate",1)
            }
        }
        //mouseWheels end

        this._graphics.onDoubleClick = (event) => {
            if(this._slot){
                this._movable = false
                this._graphics.emit("newTile", this._slot)
                this._slot = null
            }
        }
    }
}

class GSqrTile extends GTile {
    constructor(sqrTile, center, color) {
        super(color, "sqr")

        this._parentTile = sqrTile
        
        for(let i = 0, h = -1; i < 2; i++, h++) {
            this._frameTop.addChild(new Path(new Point(center.x+ (i**i) * (sqrSideLength/2), center.y- ((-i)**(-i)) * (sqrSideLength/2)), new Point(center.x+ (h**h) * (sqrSideLength/2), center.y- ((-h)**(-h)) * (sqrSideLength/2))))
            this._frameBot.addChild(new Path(new Point(center.x- (i**i) * (sqrSideLength/2), center.y+ ((-i)**(-i)) * (sqrSideLength/2)), new Point(center.x- (h**h) * (sqrSideLength/2), center.y+ ((-h)**(-h)) * (sqrSideLength/2))))
        }
        
        this._edges = this._frameTop.getChildren().concat(this._frameBot.getChildren())
        this._edges.forEach(edge => {
            edge.getConnect = () => {return edge.position}
            this._base.add(edge.getSegments()[0])
        })

        let sqrSegment = new CompoundPath()
        let frameParts = this._frame.getChildren()

        sqrTile.getSegments()[0].getEnds().forEach((edge) => {
            let i = sqrTile.getEdges().indexOf(edge)
            let edgeCenterX = (i%2 == 1) ? frameParts[1-Math.ceil(i/2)%2].getChildren()[i%2].position.x : center.x
            let edgeCenterY = (i%2 == 0) ? frameParts[  Math.ceil(i/2)%2].getChildren()[i%2].position.y : center.y
            sqrSegment.addChild(new Path([center, new Point(edgeCenterX, edgeCenterY)]))
        })

        this._pattern.addChild(sqrSegment)
        this._pattern.bringToFront()
    }

    getParentTile() {
        return this._parentTile
    }

    _rotateRight() {
        this._graphics.rotate(45)
        if(this._rotation%2 == 0) {
            this._frameTop.children.unshift(this._frameBot.children.pop())
            this._frameBot.children.unshift(this._frameTop.children.pop())
        }
    }

    _rotateLeft() {
        this._graphics.rotate(-45)
        if(this._rotation%2 == 1) {
            this._frameTop.children.push(this._frameBot.children.shift())
            this._frameBot.children.push(this._frameTop.children.shift())
        }
    }


}

class GHexTile extends GTile {
    constructor(hexTile, center, color) {
        super(color, "hex")

        this._parentTile = hexTile
        let tileWidth =  Math.sqrt(2*hexSideLength**2)

        for(let i = -0.5, h = -1.5; i < 2; i++, h++) {
            let top = new Path([center.x+(1-Math.trunc(Math.abs(h)))*(tileWidth/2), center.y+ Math.sign(h)*(octSideLength/2) + Math.trunc(h)*(tileWidth/2)],
                                [center.x+(1-Math.trunc(Math.abs(i)))*(tileWidth/2), center.y+ Math.sign(i)*(octSideLength/2) + Math.trunc(i)*(tileWidth/2)])
            let bot = new Path([center.x-(1-Math.trunc(Math.abs(h)))*(tileWidth/2), center.y+ Math.sign(h)*(octSideLength/2) + Math.trunc(h)*(tileWidth/2)],
                                [center.x-(1-Math.trunc(Math.abs(i)))*(tileWidth/2), center.y+ Math.sign(i)*(octSideLength/2) + Math.trunc(i)*(tileWidth/2)])
            this._frameTop.addChild(top)
            this._frameBot.addChild(bot)
            if(Math.abs(h+0.5) == 1) {
                bot.getConnect = () => {
                    let vector = bot.lastSegment.point.subtract(bot.firstSegment.point);
                    let ratio = vector.x**2/vector.length**2;
                    let offset = new Point((h+0.5)*Math.sign(vector.x)*Math.sqrt(hexConnectOffset**2*ratio), (h+0.5)*Math.sign(vector.y)*Math.sqrt(hexConnectOffset**2*(1-ratio)));
                    return bot.position.add(offset)
                }
                top.getConnect = () => {
                    let vector = top.lastSegment.point.subtract(top.firstSegment.point);
                    let ratio = vector.x**2/vector.length**2;
                    let offset = new Point((h+0.5)*Math.sign(vector.x)*Math.sqrt(hexConnectOffset**2*ratio), (h+0.5)*Math.sign(vector.y)*Math.sqrt(hexConnectOffset**2*(1-ratio)));
                    return top.position.add(offset)
                }
            } else {
                bot.getConnect = () => {return bot.position}
                top.getConnect = () => {return top.position}
            }
        }
        this._edges = this._frameTop.getChildren().concat(this._frameBot.getChildren().slice().reverse())

        let baseTop = new Path(this._frameTop.getChildren()[0].getSegments()[0])
        let baseBot = new Path(this._frameBot.getChildren()[0].getSegments()[0])
        for(let c = 0; c < 3; c++) {
            baseTop.add(this._frameTop.getChildren()[c].getSegments()[1])
            baseBot.add(this._frameBot.getChildren()[c].getSegments()[1])
        }
        baseBot.reverse()
        this._base.join(baseTop.join(baseBot))

        let zoneConnect = new CompoundPath()
        hexTile.getSegments().forEach((segment) => {
            let hexSegment = new CompoundPath()
            let formerCenterConnect = new Point(center.x, center.y+ (sqrSideLength/2) * ((segment.getEnds()[0].getOrientation()-1)%3 -1))
            segment.getEnds().forEach(edge => {
                let o = edge.getOrientation()
                let relevantFramePart = this._frame.getChildren()[Math.floor(o/4)].getChildren()
                let centerConnect = new Point(center.x, center.y+ (sqrSideLength/2) * ((o-1)%3 -1))
                if(centerConnect != formerCenterConnect) zoneConnect.addChild(new Path(centerConnect, formerCenterConnect))
                let edgeCenter = relevantFramePart[(o-1)%3].getConnect()

                hexSegment.addChild(new Path(centerConnect, edgeCenter))
            })
            hexSegment.addChild(zoneConnect)
            this._pattern.addChild(hexSegment)
        })
        this._frameTop.children.unshift(this._frameBot.children.shift())
        this._frameBot.children.push(this._frameTop.children.pop())
    }

    getParentTile() {
        return this._parentTile
    }

    _rotateLeft() {
        if(this._rotation%4 != 3) {
            this._frameBot.children.unshift(this._frameTop.children.shift())
            this._frameTop.children.push(this._frameBot.children.pop())
        }
        this._graphics.rotate(-45)
    }

    _rotateRight() {
        if(this._rotation%4 != 2){
            this._frameTop.children.unshift(this._frameBot.children.shift())
            this._frameBot.children.push(this._frameTop.children.pop())
        }
        this._graphics.rotate(45)
    }
}

class GBoard extends GTile{
    constructor(board, startTileColor) {
        super(startTileColor, "board")

        this._board = board

        let center = new Point(view.size.width/2, view.size.height/2)
        let tileWidth =  Math.sqrt(2*octSideLength**2)
        let midOccupied = false
        let tsl05 = octSideLength * 0.5

        for(let i = -0.5, h = -1.5; i < 2; i++, h++) {
            let top = new Path([center.x+(1-Math.trunc(Math.abs(h)))*(tileWidth/2)+tsl05, center.y+ Math.sign(h)*(octSideLength/2) + Math.trunc(h)*(tileWidth/2)],
                                            [center.x+(1-Math.trunc(Math.abs(i)))*(tileWidth/2)+tsl05, center.y+ Math.sign(i)*(octSideLength/2) + Math.trunc(i)*(tileWidth/2)])
            let bot = new Path([center.x-(1-Math.trunc(Math.abs(h)))*(tileWidth/2)-tsl05, center.y- Math.sign(h)*(octSideLength/2) - Math.trunc(h)*(tileWidth/2)],
                                            [center.x-(1-Math.trunc(Math.abs(i)))*(tileWidth/2)-tsl05, center.y- Math.sign(i)*(octSideLength/2) - Math.trunc(i)*(tileWidth/2)])
            this._frameTop.addChild(top)
            this._frameBot.addChild(bot)
            top.getConnect = () => {return top.position}
            bot.getConnect = () => {return bot.position}
        }
        let top = new Path(this._frameBot.getLastChild().getLastSegment(),this._frameTop.getFirstChild().getFirstSegment())
        let bot = new Path(this._frameTop.getLastChild().getLastSegment(),this._frameBot.getFirstChild().getFirstSegment())
        this._frameTop.insertChild(0, top)
        this._frameBot.insertChild(0, bot)
        top.getConnect = () => {return top.position}
        bot.getConnect = () => {return bot.position}

        this._board.getPathways().forEach(p => {
            let sEnds = p.getSegments()[0].getEnds()
            let gSegment = new CompoundPath()
            let connLines = new CompoundPath()
            let iOccupyMid = false

            sEnds.forEach(edge => {
                let index = this._board.getEdges().indexOf(edge)
                let line = new Path({x:center.x, y:center.y-tileWidth/2},{x:center.x, y:center.y-tsl05-tileWidth/2})
                line.rotate(index*45, center)
                gSegment.addChild(line)
            })

            if(sEnds.length > 1){
                let i = 0
                for(let c = 1; c < sEnds.length; c++) {
                    if (iOccupyMid) {
                        connLines.addChild(new Path(gSegment.getChildren()[c].getSegments()[0].getPoint(), this._graphics.position))
                    } else if(this._board.getEdges().indexOf(sEnds[i])%2 == this._board.getEdges().indexOf(sEnds[c])%2) {
                        connLines.addChild(new Path(gSegment.getChildren()[i].getSegments()[0].getPoint(),gSegment.getChildren()[c].getSegments()[0].getPoint()))
                        if(this._board.getEdges().indexOf(sEnds[i])%4 == this._board.getEdges().indexOf(sEnds[c])%4 && !midOccupied) {
                            iOccupyMid = true
                            midOccupied = true
                            gSegment.getChildren()[0].getSegments()[0].setPoint(this._graphics.position)
                            for(let d = 0; d < connLines.getChildren().length-1; d++) {
                                connLines.getChildren()[d].getSegments()[1].setPoint(this._graphics.position)
                            }
                        }
                        i = c
                    } else if( ( (this._board.getEdges().indexOf(sEnds[c])-this._board.getEdges().indexOf(sEnds[i])) +8) %8 == 1) {
                        let meet = new Point(this._graphics.position.add({x:0, y:-tsl05}))
                        let conn = new Path(meet,this._graphics.position.add(-tsl05))
                        conn.rotate(45*this._board.getEdges().indexOf(sEnds[c]),this._graphics.position)
                        gSegment.getChildren()[c].getSegments()[0].setPoint(conn.getSegments()[0].getPoint())
                        connLines.addChild(conn)
                    } 
                    else if(this._board.getEdges().indexOf(sEnds[i+1])%2 == this._board.getEdges().indexOf(sEnds[c])%2 && sEnds[i+1] != sEnds[c] && !this._board.getEdges()[(this._board.getEdges().indexOf(sEnds[i+1])+1)%8].hasConnect()) {
                        let corner = new Point(this._graphics.position.add({x:tsl05, y:-tsl05}))
                        let conn1 = new Path({x:this._graphics.position.x, y:this._graphics.position.y-tsl05},corner)
                        let conn2 = new Path({x:this._graphics.position.x+tsl05, y:this._graphics.position.y},corner)
                        conn1.rotate(45*this._board.getEdges().indexOf(sEnds[c-1]), this._graphics.position); conn2.rotate(45*this._board.getEdges().indexOf(sEnds[c-1]), this._graphics.position)
                        gSegment.getChildren()[c].getSegments()[0].setPoint(conn2.getSegments()[0].getPoint())
                        connLines.addChildren([conn1, conn2])
                    } 
                    else if(!this._board.getEdges()[(this._board.getEdges().indexOf(sEnds[c])+7)%8].hasConnect()) {
                        let corner = new Point(this._graphics.position.add({x:tsl05, y:tsl05}))
                        let conn1 = new Path({x:this._graphics.position.x, y:this._graphics.position.y+tsl05},corner)
                        let conn2 = new Path({x:this._graphics.position.x+tsl05, y:this._graphics.position.y-tsl05},corner)
                        conn1.rotate(45*(this._board.getEdges().indexOf(sEnds[c])-4), this._graphics.position); conn2.rotate(45*(this._board.getEdges().indexOf(sEnds[c])-4), this._graphics.position)
                        gSegment.getChildren()[c].getSegments()[0].setPoint(conn1.getSegments()[0].getPoint())
                        gSegment.getChildren()[i].getSegments()[0].setPoint(conn2.getSegments()[0].getPoint())
                        connLines.addChildren([conn1, conn2])
                    }
                    else if(!this._board.getEdges()[(this._board.getEdges().indexOf(sEnds[i])+1)%8].hasConnect() && ( (this._board.getEdges().indexOf(sEnds[c])-this._board.getEdges().indexOf(sEnds[i])) +8) %8 < 4) {
                        let corner = new Point(this._graphics.position.add({x:tsl05, y:-tsl05}))
                        let conn2 = new Path({x:this._graphics.position.x, y:this._graphics.position.y-tsl05},corner)
                        let conn1 = new Path({x:this._graphics.position.x+tsl05, y:this._graphics.position.y+tsl05},corner)
                        conn1.rotate(45*(this._board.getEdges().indexOf(sEnds[c])-3), this._graphics.position); conn2.rotate(45*(this._board.getEdges().indexOf(sEnds[c])-3), this._graphics.position)
                        gSegment.getChildren()[i].getSegments()[0].setPoint(conn2.getSegments()[0].getPoint())
                        gSegment.getChildren()[c].getSegments()[0].setPoint(conn1.getSegments()[0].getPoint())
                        connLines.addChildren([conn1, conn2])
                        i = c
                    } 
                    else if (!midOccupied /*&& connLines.getChildren().length == 0*/) {
                        connLines.addChild(new Path(gSegment.getChildren()[c].getSegments()[0].getPoint(), this._graphics.position))
                        connLines.addChild(new Path(gSegment.getChildren()[c-1].getSegments()[0].getPoint(), this._graphics.position))
                        gSegment.getChildren()[0].getSegments()[0].setPoint(this._graphics.position)
                        for(let d = 0; d < connLines.getChildren().length-1; d++) {
                            connLines.getChildren()[d].getSegments()[1].setPoint(this._graphics.position)
                        }
                        iOccupyMid = true
                        midOccupied = true
                    } else alert("something went wrong")
                }
            }
            this._pattern.addChild(connLines)
            this._pattern.addChild(gSegment)
        })
        this._edges = this._frameTop.getChildren().concat(this._frameBot.getChildren())
        this._accessibleEdges = this._edges.slice()
        this._edges.forEach(edge => {
            this._base.add(edge.getSegments()[0])
        })

        this._frameTop.insertChild(0, this._frameBot.getLastChild())
        this._frameBot.insertChild(0, this._frameTop.getLastChild())
        this._frameTop.removeChildren(5)
        this._frameBot.removeChildren(5)

        this._slots = {}
        this._slotGroup = new Group()

        this._tileGroup = new Group()
        this._graphics.addChild(this._tileGroup)
    }

    addGTile(gTile, edges) {
        let tileEdges = gTile.getEdges().slice()
        tileEdges = tileEdges.concat(tileEdges)

        console.log(edges.length)
        this._edges.push(...gTile.getEdges())

        let eLen = edges.length
        for(let c = 0; c < eLen; c++) {
            this._accessibleEdges.splice(edges[c].b, 1, ...tileEdges.slice(edges[c].t+1,
                (edges[c].t < edges[(c+1)%eLen].t) ? edges[(c+1)%eLen].t : edges[(c+1)%eLen].t+tileEdges.length/2))
            
        }
        this._tileGroup.addChild(gTile._graphics)
        console.log(this._accessibleEdges)
        this.toBack()
        this.removeSlots()
        return true
    }

    removeSlots() {
        this._slots = {}
        this._slotGroup.removeChildren()
    }

    getSlots() {
        return {edges:this._slots,paths:this._slotGroup.getChildren()}
    }

    generateSlots(gTile) {
        let bEdges = this._board.getAccessibleEdges().slice()
        let tEdges = gTile.getParentTile().getEdges().slice()
        for(let c = 0; c < bEdges.length; c++) {
            for(let c1 = 0; c1 < tEdges.length; c1++) {
                if(tEdges[c1].hasConnect() == bEdges[c].hasConnect() && (tEdges[c1].getOrientation() + bEdges[c].getOrientation()) == 7){
                    let offset = gTile.getCenter().subtract(gTile.getEdges()[c1].getConnect()), absX = Math.abs(offset.x), absY=Math.abs(offset.y)

                    //console.log(offset.x**2/offset.length**2, offset.y**2/offset.length**2)
                    if(tEdges[c1].isDiagonal()){
                        let frameWidthParts = Math.sqrt(frameWidth**2/2);
                        offset.x +=frameWidthParts*Math.sign(offset.x)
                        offset.y +=frameWidthParts*Math.sign(offset.y)
                    } else {
                        if(absX>absY) {
                            offset.x = offset.x+absX*(frameWidth/offset.x)
                        } else {
                            offset.y = offset.y+absY*(frameWidth/offset.y)
                        }
                    }

                    let slotPosition = this._accessibleEdges[(c)%this._accessibleEdges.length].getConnect().add(offset)
                    this.generateSlot(gTile, slotPosition, {t:c1, b:c})
                }
            }
        }
        this._slotGroup.sendToBack()
    }

    generateSlot(gTile, position, edges) {
        (this._slots[`${position.x}/${position.y}`] ?? (this._slots[`${position.x}/${position.y}`] = [])).push(edges)
        if(this._slots[`${position.x}/${position.y}`].length == 1) {
            let slot = new Path()
            slot.edges = [edges]
            slot.copyContent(gTile.getBase())
            slot.fillColor = "rgba(255,255,255,0.2)"
            slot.strokeColor = "rgba(255,255,255,0.3)"
            slot.strokeWidth = frameWidth
            slot.strokeCap = "round"
            slot.strokeJoin = "round"
            slot.setPosition(position)

            let collides = false
            this._accessibleEdges.forEach(edge => {
                if(edge.intersects(slot)) collides = true
            })
            if(!collides) this._slotGroup.addChild(slot)
            else slot.remove()
        }
    }
}

// complete model & graphics
class GameModel extends LocalEventEmitter{
    constructor(board, sqrStack, hexStack) {
        super()
        this._board = board
        this._sqrStack = sqrStack
        this._hexStack = hexStack
        this._remainingTiles = 25
    }

    restock(tile) {
        if (tile instanceof SqrTile) this._sqrStack.push(tile);
        else if (tile instanceof HexTile) this._hexStack.push(tile);
    }

    rotate(args) {
        if(args.type == "sqr") {
            this._sqrStack[0].rotate(args.steps)
        }else if(args.type == "hex") {
            this._hexStack[0].rotate(args.steps)
        }
    }

    getSqrStack() {
        return this._sqrStack
    }

    getHexStack() {
        return this._hexStack
    }

    getStacks() {
        return {sqr:this.getSqrStack, hex:this.getHexStack}
    }

    addTile(args) {
        if(this._board.addTile(args.type == "sqr" ? this._sqrStack[0] : this._hexStack[0], args.edges)) {
            args.type == "sqr" ? this._sqrStack.shift() : this._hexStack.shift()
            return true
        }
        return false
    }

    getBoard() {
        return this._board
    }
}

class GameGraphics extends LocalEventEmitter{
    constructor(gameModel, friendlyColor, hostileColor, neutralColor) {
        super()

        this._friendlyColor = friendlyColor
        this._hostileColor = hostileColor
        this._neutralColor = neutralColor
        this._gBoard = new GBoard(gameModel.getBoard(), neutralColor)
        
        this._gSqrStack = []
        gameModel.getSqrStack().forEach(tile => {
            let gSqr = new GSqrTile(tile, {x:view.size.width-250 +5*this._gSqrStack.length, y:view.size.height-200 +25*this._gSqrStack.length} ,hostileColor)
            gSqr.toBack()
            this._installGTileListeners(gSqr)
            this._gSqrStack.push(gSqr)
        })
        this._gSqrStack[0]._movable = true

        this._gHexStack = []
        gameModel.getHexStack().forEach(tile => {
            let gHex = new GHexTile(tile, {x:view.size.width-100 +5*this._gHexStack.length, y:view.size.height-200 +25*this._gHexStack.length} ,friendlyColor)
            gHex.toBack()
            this._installGTileListeners(gHex)
            this._gHexStack.push(gHex)
        })
        this._gHexStack[0]._movable = true

        this._gBoard.toBack()
    }

    setTilesMovable() {
        this._gSqrStack[0]._movable = true
        this._gHexStack[0]._movable = true
    }

    updateSqrStack(sqrStack, edgePairs) {
        if(sqrStack[sqrStack.length-1] == this._gSqrStack[this._gSqrStack.length-1]._parentTile) return

        this._gBoard.addGTile(this._gSqrStack.shift(), edgePairs)
        this._gSqrStack.forEach(sqr => {
            sqr.setPosition(sqr.getBase().getPosition().subtract(new Point(5,25)))
        })
        this._gSqrStack.push(new GSqrTile(sqrStack[2], {x:view.size.width-240, y:view.size.height-150}, this._friendlyColor))
        this._gSqrStack[2].toBack()
        this._installGTileListeners(this._gSqrStack[this._gSqrStack.length-1])
    }

    updateHexStack(hexStack, edgePairs) {
        if(hexStack[hexStack.length-1] == this._gSqrStack[this._gSqrStack.length-1]._parentTile) return

        this._gBoard.addGTile(this._gHexStack.shift(), edgePairs)
        this._gHexStack.forEach(hex => {
            hex.setPosition(hex.getBase().getPosition().subtract(new Point(5,25)))
        })
        this._gHexStack.push(new GHexTile(hexStack[2], {x:view.size.width-90, y:view.size.height-150}, this._hostileColor))
        this._gHexStack[2].toBack()
        this._installGTileListeners(this._gHexStack[this._gHexStack.length-1])
    }

    _installGTileListeners(stackTile) {
        stackTile.on("needSlots", gTile => {
            this._generateSlots(gTile)
            let hitPoint = gTile.getBase().position
            this._gBoard.getSlots().paths.forEach(slot => {
                if(slot.contains(hitPoint)) {
                    gTile.setPosition(slot.position)
                    gTile.setSlot(slot)
                }
            })
        })
        stackTile.on("rotate", steps => this.emit("rotate", {steps:steps, type:stackTile.getType()}))
        stackTile.on("activated", gTile => {
            if(gTile.getType() == "sqr") {
                this._deactivateHexStack()
            } else {
                this._deactivateSqrStack()
            }
        })
        stackTile.on("newTile", slot => {
            this.emit("newTile", {type:stackTile.getType(), edges:slot.edges})
        })
    }

    _deactivateHexStack() {
        this._gHexStack[0].setPosition({x:view.size.width-100, y:view.size.height-200})
        this._gHexStack[0].rotate(1- (this._gHexStack[0].getRotation()+1)%4)
    }

    _deactivateSqrStack() {
        this._gSqrStack[0].setPosition({x:view.size.width-250, y:view.size.height-200})
        if(this._gSqrStack[0].getRotation()%2 == 1) this._gSqrStack[0].rotate(1)
    }

    _generateSlots(gTile) {
        this._gBoard.removeSlots()
        this._gBoard.generateSlots(gTile)
    }
}

const start = () => {
    let sqrStack = []
    for(let x = 0; x < 3; x++) {
        let edges = []
        let segments = [[]]
        for(let y = 0; y < 4; y++) {
            edges.push(new TileEdge(Math.random() < 0.5, y*2))
            if(edges[y].hasConnect()) {
                segments[0].push(edges[y])
            }
        }
        sqrStack.push(new SqrTile(edges, segments))
    }

    let hexStack = []
    for(let x = 0; x < 3; x++) {
        let edgestop = []
        let edgesbot = []
        let segmentsProto = []
        for(let y = 0; y < 3; y++) {
            let segment = []
            edgestop.push(new TileEdge(Math.random() < 0.5, y+1))
            edgesbot.push(new TileEdge(Math.random() < 0.5, -y-1))
            if(edgestop[edgestop.length-1].hasConnect()) segment.push(edgestop[edgestop.length-1])
            if(edgesbot[edgesbot.length-1].hasConnect()) segment.push(edgesbot[edgesbot.length-1])
            if(segment.length > 0) segmentsProto.push(segment)
        }
        let edges = edgestop.concat(edgesbot.reverse())
        let segments = []
        if(segmentsProto.length>0) segments.push(segmentsProto[0])
        for(let y = 0; y < segmentsProto.length-1; y++) {
            (Math.random() < 0.5) ? segmentsProto[y+1].forEach(edge=>{segments[segments.length-1].push(edge)}) : segments.push(segmentsProto[y+1])
        }
        hexStack.push(new HexTile(edges, segments))
    }

    let bEdges = []
    let bSegmentArrays = []
    let bSegments = []
    
    if(debug){
        bEdges = [new TileEdge(true,0), 
            new TileEdge(false,1), 
            new TileEdge(false,2), 
            new TileEdge(true,3), 
            new TileEdge(true, 4), 
            new TileEdge(true, 5), 
            new TileEdge(false, 6), 
            new TileEdge(true, 7)]
    
        bSegmentArrays = [ [bEdges[0], bEdges[3], bEdges[5]], [bEdges[7]], [bEdges[4]] ]
    
        bSegmentArrays.forEach(segment => {
            bSegments.push(new Pathway(new Segment(segment)))
        })
    } else {
        for (x = 0; x < 8; x++) {
            bEdges.push(new TileEdge(Math.random() < .65, x))
        }
        
        for ( x = 0; x < 8; x++) {
            if (bEdges[x].hasConnect()) {
                if(bSegmentArrays == []) {
                    bSegmentArrays.push([bEdges[x]])
                } else {
                    let z = -1;
                    let connected = false;
                    bSegmentArrays.forEach(segment => {
                        if(bEdges.indexOf(segment[segment.length-1]) > z && !connected) {
                            z = bEdges.indexOf(segment[segment.length-1])
                            if(Math.random() < (1/(bSegmentArrays.length+1))) {
                                segment.push(bEdges[x])
                                connected = true;
                            }
                        }
                    })
                    if(!connected) bSegmentArrays.push([bEdges[x]])
                }
            }
        }

        bSegmentArrays.forEach(segment => {
            bSegments.push(new Pathway(new Segment(segment)))
        })
    }

    let edgeStr = "Board:\n"
        for(let c = 0; c < bEdges.length; c++) {
            edgeStr += `\tEdge ${c}: o = ${bEdges[c].getOrientation()},\t c = ${bEdges[c].hasConnect()}`
            for(let c1 = 0; c1 < bSegments.length; c1++) {
                let c2 = 0
                bSegments[c1].getSegments()[0].getEnds().forEach(end => {
                    if(end == bEdges[c]) edgeStr += `:  Seg${c1}, Pos${c2}`
                    c2++
                })
            }
            edgeStr += "\n"
        }
        console.log(edgeStr)

    const red = new TeamColor(224, 17, 95)
    const blue = new TeamColor(0,95*2,106*2)
    const green = new TeamColor(173,255,47)
    
    let b = new Board(bEdges, bSegments)
    let model = new GameModel(b, sqrStack, hexStack)
    let graphics = new GameGraphics(model, blue, red, green)



    graphics.on("rotate", args => {
        model.rotate(args)
    })
    graphics.on("newTile", args => {
        if(model.addTile(args)) {
            let newTile
            if(args.type == "sqr") {
                let edges = []
                let segments = [[]]
                for(let y = 0; y < 4; y++) {
                    edges.push(new TileEdge(Math.random() < 0.5, y*2))
                    if(edges[y].hasConnect()) {
                        segments[0].push(edges[y])
                    }
                }
                newTile = new SqrTile(edges, segments)
            } else {
                let edgestop = []
                let edgesbot = []
                let segmentsProto = []
                for(let y = 0; y < 3; y++) {
                    let segment = []
                    edgestop.push(new TileEdge(Math.random() < 0.5, y+1))
                    edgesbot.push(new TileEdge(Math.random() < 0.5, -y-1))
                    if(edgestop[edgestop.length-1].hasConnect()) segment.push(edgestop[edgestop.length-1])
                    if(edgesbot[edgesbot.length-1].hasConnect()) segment.push(edgesbot[edgesbot.length-1])
                    if(segment.length > 0) segmentsProto.push(segment)
                }
                let edges = edgestop.concat(edgesbot.reverse())
                let segments = []
                if(segmentsProto.length>0) segments.push(segmentsProto[0])
                for(let y = 0; y < segmentsProto.length-1; y++) {
                    (Math.random() < 0.5) ? segmentsProto[y+1].forEach(edge=>{segments[segments.length-1].push(edge)}) : segments.push(segmentsProto[y+1])
                }
                newTile = new HexTile(edges, segments)
            }
            model.restock(newTile)
            args.type == "sqr" ? graphics.updateSqrStack(model.getSqrStack(), args.edges) : graphics.updateHexStack(model.getHexStack(), args.edges)
        }
        graphics.setTilesMovable()
    })

    graphics._gBoard.generateSlots(graphics._gSqrStack[0])

    console.log("Model", model,"\nGraphics", graphics)

    view.on("",)

}