let tileSideLength = 50                                     // All of the tiles should have the same side length
let canvas = document.getElementById("someGeometryGame")
let orientationCycle = [0,1,2,3,7,6,5,4]                 // The orientation of two  opposite Sides always has a sum of 7

window.addEventListener("resize", function(){
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}, false);



class tileEdge {
    constructor(orientation){
        this.orientation = orientationCycle[orientation%8]
        this.hasConnect = (Math.random() < 0.5)
    }

    isDiagonal() {
        return (this.orientation ==4 || (this.orientation%5)%2 == 1)
    }
}

class SqrTile {
    constructor(){
        this.edges = []
        let connectCount = 0
        for(let x = 0; x < 4; x++){
            this.edges.push(new tileEdge(orientationCycle[x*2]))

            if(x==3 && connectCount == 1) this.edges[x].hasConnect = true
            else if( x == 3 && connectCount == 0) this.edges[x].hasConnect = false
            if(this.edges[x].hasConnect) connectCount++
        }


        // visualization
        this.graphic = new Group()
        this.foundation = new Path()
        this.lines = new Path()
        this.frame = new Group()
        this.frameTop = new Path()
        this.frameBot = new Path()
        this.rotation = 0
        this.movable = true
    }

    rotateEdges() {

    }

    visualize(centerPoint){
        this.foundation = new Path([centerPoint[0]-tileSideLength/2,centerPoint[1]+tileSideLength/2])
        this.foundation.add([centerPoint[0]-tileSideLength/2,centerPoint[1]-tileSideLength/2])
        this.foundation.add([centerPoint[0]+tileSideLength/2,centerPoint[1]-tileSideLength/2])
        this.foundation.add([centerPoint[0]+tileSideLength/2,centerPoint[1]+tileSideLength/2])
        this.foundation.fillColor = "rgb(150,150,200)"
        this.foundation.closePath()
        this.graphic.addChild(this.foundation)

        for (let x = 0; x < 3; x++) {
            this.frameTop.add(this.foundation.segments[x])
            this.frameBot.add(this.foundation.segments[(2+x)%4])
        }

        this.frameBot.strokeColor = "rgb(50,50,150)"
        this.frameBot.strokeWidth = 2
        this.frameBot.strokeCap = "round"
        this.frame.addChild(this.frameBot)

        this.frameTop.strokeColor = "rgb(150,150,250)"
        this.frameTop.strokeWidth = 2
        this.frameTop.strokeCap = "round"
        this.frame.addChild(this.frameTop)

        this.graphic.addChild(this.frame)

        for(let x = 0; x < 4; x++) {
            if(this.edges[x].hasConnect) {
                this.lines.join(new Path([centerPoint , [ (this.foundation.segments[x].point.x+this.foundation.segments[(x+1)%4].point.x)/2 , (this.foundation.segments[x].point.y+this.foundation.segments[(x+1)%4].point.y)/2 ]]))
            }
        }
        this.lines.strokeColor = "rgb(0,0,0)"
        this.lines.strokeWidth = 4
        this.lines.strokeCap = "round"
        this.graphic.addChild(this.lines)

        this.initialiseMouseEvents(centerPoint)
    }

    initialiseMouseEvents(){
        this.graphic.onMouseDrag = (event) => {
            if(this.movable){
                this.graphic.position.x += event.delta.x;
                this.graphic.position.y += event.delta.y;
            }
        }
        this.graphic.onClick = (event) => {
            if(this.movable && Math.abs(event.delta.x)+Math.abs(event.delta.y) == 0){
                this.edges.forEach(edge => {
                    edge.orientation = orientationCycle[(orientationCycle.indexOf(edge.orientation)+1)%8]
                })

                //graphics
                this.graphic.rotate(45,this.foundation.position)
                if(this.rotation == 1) this.frame.rotate(-90)
                this.rotation = (this.rotation+1)%2
            }
        }
    }
}

class HexTile {
    constructor(){
        this.edges = []
        let connectCount = 0
        for(let x = 0, oCount = 3; x < 6; x++, oCount++){
            this.edges.push(new tileEdge(oCount))

            if(x==5 && connectCount == 1) this.edges[x].hasConnect = true
            else if( x == 5 && connectCount == 0) this.edges[x].hasConnect = false
            if(this.edges[x].hasConnect) connectCount++

            if(x == 2) oCount++
        }

        //graphics
        this.graphic = new Group()
        this.foundation = new Path()
        this.lines = new Group()
        this.frame = new Group()
        this.frameTop = new Path()
        this.frameBot = new Path()
        this.rotation = 0
        
        this.movable = true
    }

    visualize(centerPoint){
        let plmin = [1,-1]
        //getting top&bottom triangle hypothenuse
        let h = Math.sqrt(2*tileSideLength**2)

        //getting corner points
        let corners = []
        plmin.forEach(i => {
            corners.push([centerPoint[0], centerPoint[1]-i*(tileSideLength+h)/2])
            corners.push([centerPoint[0]-(i*h/2),centerPoint[1]-(i*tileSideLength/2)])
            corners.push([centerPoint[0]-(i*h/2),centerPoint[1]+(i*tileSideLength/2)])
        })

        //drawing the shape
        corners.forEach(i=>{
            this.foundation.add(i)
        })
        this.foundation.closePath()
        this.foundation.fillColor = "rgb(150,150,200)"
        this.graphic.addChild(this.foundation)

        for(let x = 0; x < corners.length/2+1; x++){
            this.frameTop.add(corners[x])
            this.frameBot.add(corners[(x+3)%6])
        }
        this.frameBot.strokeColor = "rgb(50,50,150)"
        this.frameBot.strokeWidth = 2
        this.frameBot.strokeCap = "round"
        this.frame.addChild(this.frameBot)

        this.frameTop.strokeColor = "rgb(150,150,250)"
        this.frameTop.strokeWidth = 2
        this.frameTop.strokeCap = "round"
        this.frame.addChild(this.frameTop)

        this.graphic.addChild(this.frame)

        let lineSegments = []                           //creating an array for possible separate segments

        for(let x = 0; x < this.edges.length; x++) {
            if(this.edges[x].hasConnect){
                let edgeEnd1 = this.foundation.segments[x].point
                let edgeEnd2 = this.foundation.segments[(x+1)%6].point
                let edgeCenter = (edgeEnd1.add(edgeEnd2)).divide(2)
                let connectionPoint = this.foundation.position //assume the connection point is the center: only used w/ the horizontal edges

                if(this.edges[x].isDiagonal()){
                    // find connection point if the edges are diagonal
                    let c1 = new Point(edgeEnd1.x, edgeEnd2.y)  // looking for the two possible Points
                    let c2 = new Point(edgeEnd2.x, edgeEnd1.y)

                    if((c1.subtract(connectionPoint)).abs() > (c2.subtract(connectionPoint)).abs()) connectionPoint = c2 // find the correct one by finding the one nearer to the objects center
                    else connectionPoint = c1
                }
                lineSegments.push(new Path([edgeCenter, connectionPoint]))  // add a Path to the Line Segment Array
            }else lineSegments.push(new Path())
        }
        
        for(let x = 0; x < lineSegments.length/2; x++) {                    // combine the two "right", two "middle" and two "left" paths
            lineSegments[x].join(lineSegments[lineSegments.length-1-x])
        }
        lineSegments = lineSegments.slice(0,3)

        for(let x = 0; x < lineSegments.length; x++){                                                        // connect the ones with path
            if(lineSegments[x].segments.length > 1 && lineSegments[(x+1)%3].segments.length > 1 && Math.random()/2 < (1/(lineSegments[x].segments.length-1)**4)+(1/(lineSegments[(x+1)%3].segments.length-1)**4)) {
                // only consider them, if none of the elements is a placeholder path
                // connect them, if a random number between 0 and 0.5 is smaller than (1/(length[current]-1)^4)+(1/(length[next]-1)^4). Length can only be 1 or 2. if one of them is 1, the sum is larger than 0.5 as 1/1^4 = 1. If both are 2, the Sum is 1/2^4 + 1/2^4 = 2/16 = 1/8
                lineSegments[x].add(lineSegments[x].segments[1].point)
                lineSegments[x].add(lineSegments[(x+1)%3].segments[1].point)
                if (lineSegments[(x+1)%3].segments.length == 2) lineSegments[(x+1)%3].add(lineSegments[x].segments[1].point)
            }
        }

        lineSegments.forEach(segment => {
            this.lines.addChild(segment)
        })

        this.lines.strokeColor = "rgb(0,0,0)"
        this.lines.strokeWidth = 4
        this.lines.strokeCap = "round"
        this.graphic.addChild(this.lines)


        this.graphic.rotate(90)

        this.initialiseMouseEvents()
    }

    initialiseMouseEvents(){
        this.graphic.onMouseDrag = (event) => {
            if(this.movable){
                this.graphic.position.x += event.delta.x;
                this.graphic.position.y += event.delta.y;
            }
        }
        this.graphic.onClick = (event) => {
            if(this.movable && Math.abs(event.delta.x)+Math.abs(event.delta.y) == 0){
                this.graphic.rotate(45)
                if(this.rotation != 3){
                    this.frameBot.add(this.frameTop.segments[1])
                    this.frameTop.add(this.frameBot.segments[1])
                    this.frameBot.removeSegment(0)
                    this.frameTop.removeSegment(0)
                }
                this.rotation = (this.rotation+1)%4
            }
        }
    }
}

class OctTile {
    constructor(){

    }

    visualize(centerPoint){
        let plmin = [1,-1]
        //getting incircle radius
        let r = (tileSideLength/2) / Math.tan((22.5*Math.PI)/180)
    
        //getting corner points
        let corners = []
        plmin.forEach(i => {
            let oneSide = []
            let x = centerPoint[0] + (r*i)
            let y = centerPoint[1] + (r*i)
    
            oneSide.push([centerPoint[0]+(1*i)*(tileSideLength/2),centerPoint[1] - (r*i)]) //point of the geometrically other half
    
            oneSide.push([x,centerPoint[1]-(1*i)*(tileSideLength/2)]) //points of one half of the octagon
            oneSide.push([x,centerPoint[1]+(1*i)*(tileSideLength/2)])
            oneSide.push([centerPoint[0]+(1*i)*(tileSideLength/2),y])
            oneSide.push([centerPoint[0]-(1*i)*(tileSideLength/2),y])
    
            corners.push(oneSide)
        })
    
        let octagon = new Path
        
        for(let x=0;x<2;x++) {
            let side = new Path()
            corners[x].forEach(corner => {
                side.add(corner[0],corner[1])
            })
            side.strokeColor = "rgb(" + (100-(plmin[x]*50)).toString() + "," + (200-(plmin[x]*50)).toString() + "," + (100-(plmin[x]*50)).toString() + ")"
            side.strokeWidth = 3
            side.strokeCap = "round"
            octagon.addSegments(side.segments)
        }
        octagon.fillColor = "rgb(150,200,150)"
    }
}

class AllTiles {
    constructor(){

    }
}

//start
start = () => {

    document.body.style.background = "rgb(101, 104, 121)";

    /*let p = new Path()
    p.strokeColor = 'black';
    p.add(new Point(0, 0));
    p.add(new Point(0, view.size.height));
    p.add(new Point(view.size.width, view.size.height))
    p.add(new Point(view.size.width, 0))*/

    let startTile = new OctTile()
    startTile.visualize([view.size.width/2, view.size.height/2])

    for (let x = 0; x < 15; x++) {
        let testSqr = new SqrTile()
        testSqr.visualize([view.size.width-350-x*5,view.size.height-200-x*20])
    }

    for (let x = 0; x < 15; x++) {
        let testHex = new HexTile()
        testHex.visualize([view.size.width-200-x*5,view.size.height-200-x*20])
    }
}