function Dots(){
	
	this.verge = 300, this.sqVerge = 20; // use this.verge to make game field bigger this.verge = 400 or this.verge = 500, etc...
	this.leftMoves = (this.verge / this.sqVerge - 1) * (this.verge / this.sqVerge - 1);
	
	this.pointList = [], this.PL = [];
	this.curentPoints = [];
	this.results = {};
	
	this.colors = [{color:'#ff0000', name:'красный'}, {color:'#0000ff', name:'синий'}];
	
	this.objLength = function(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	};
	
	
	this.closedArea = function(x, y, player, firstClickX, firstClickY, pointList, parentCoordinates, depth, curPoints, firstStart){
		
		firstStart = firstStart || false;
		depth++;
						
		if(curPoints[x+":"+y]) return; // avoid looping and other related ways
		if(x == firstClickX && y == firstClickY && firstStart == false){

			if(depth > 4){
				console.log("Область замкнута: точек " + (depth-1));
				curPoints[x+":"+y] = {x:x,y:y};
				
				dotsInArea = this.findDots(curPoints, pointList, player); // find dots inside closed area
				
				this.results = {closedAreaDotsCount: depth-1, dotsInArea:dotsInArea};
				this.curentPoints = [], i = 0;
				for(var el in curPoints) {
					this.curentPoints[i] = curPoints[el];
					i++;
				}	
			}
							
			return;							
		}
						
		if(pointList[x+":"+y] && pointList[x+":"+y].player != player)  return; // near is the rival's point - leave the recursion iteration
		if(!pointList[x+":"+y] || this.PL[x+":"+y].pwned) return;	// if the point does not belong to anyone - leave the recursion iteration
						
		if(firstStart == false) {
			var xP = parentCoordinates.x, yP = parentCoordinates.y;
			curPoints[x+":"+y] = {x:x,y:y}
		}
						
		// condiotions to not come back to parent dot
		if(xP!=(x+this.sqVerge) 	|| yP!=y) this.closedArea(x+this.sqVerge, y, player, firstClickX, firstClickY, pointList, {x:x, y:y}, depth, curPoints);			// right 		
		if(xP!=(x-this.sqVerge) 	|| yP!=y) this.closedArea(x-this.sqVerge, y, player, firstClickX, firstClickY, pointList, {x:x, y:y}, depth, curPoints);			// left
		if(xP!=x 			|| yP!=(y+this.sqVerge)) this.closedArea(x, y+this.sqVerge, player, firstClickX, firstClickY, pointList, {x:x, y:y}, depth, curPoints);		//down
		if(xP!=x 			|| yP!=(y-this.sqVerge)) this.closedArea(x, y-this.sqVerge, player, firstClickX, firstClickY, pointList, {x:x, y:y}, depth, curPoints);		// up
		if(xP!=(x+this.sqVerge) 	|| yP!=(y+this.sqVerge)) this.closedArea(x+this.sqVerge, y+this.sqVerge, player, firstClickX, firstClickY, pointList, {x:x, y:y}, depth, curPoints);	// right down
		if(xP!=(x-this.sqVerge) 	|| yP!=(y+this.sqVerge)) this.closedArea(x-this.sqVerge, y+this.sqVerge, player, firstClickX, firstClickY, pointList, {x:x, y:y}, depth, curPoints);	// left down
		if(xP!=(x+this.sqVerge) 	|| yP!=(y-this.sqVerge)) this.closedArea(x+this.sqVerge, y-this.sqVerge, player, firstClickX, firstClickY, pointList, {x:x, y:y}, depth, curPoints);	//right up
		if(xP!=(x-this.sqVerge) 	|| yP!=(y-this.sqVerge)) this.closedArea(x-this.sqVerge, y-this.sqVerge, player, firstClickX, firstClickY, pointList, {x:x, y:y}, depth, curPoints);	// left up
		
		delete curPoints[x+":"+y];
		
		return;	
	} // end closedArea
	
	this.findDots = function(dotsUnact, pointList, player){
			
			//console.log("curPoints in findDots", dotsUnact);
			var arrX = [], arrY = [];
			var xTmp = [];
			var i=0, dotsInArea=0;
			for(var el in dotsUnact) {
				//console.log(dotsUnact[el].x +":"+ dotsUnact[el].y);
				arrX[i] = dotsUnact[el].x; arrY[i] = dotsUnact[el].y; 
				i++;
			}
						
			var minY = this.minMaxFinder(arrY, "min");
			var maxY = this.minMaxFinder(arrY, "max");
			var minCurX = 0, maxCurX = 0;
						
			for(var i=(minY+this.sqVerge); i<maxY; i+=this.sqVerge){

				k=0;
				for(var el in dotsUnact) {
					if(dotsUnact[el].y == i){
						xTmp[k] = dotsUnact[el].x;
						k++;
					}	
				}
							
				minCurX = this.minMaxFinder(xTmp, "min");
				maxCurX = this.minMaxFinder(xTmp, "max");
							
				for(var j=minCurX+this.sqVerge; j < maxCurX; j++){
					if(pointList[j+":"+i] && pointList[j+":"+i].player != player && !this.PL[j+":"+i].pwned) {
						this.PL[j+":"+i].pwned = true;
						dotsInArea++;
					}
				}
							
				xTmp.splice(0,(xTmp.length)); // удаляем все элементы
								
			}
			console.log("всего точек в области - " + dotsInArea);
						
			return dotsInArea; 			
		} // end findDots
		
		this.minMaxFinder = function(obj, action){
			
			var i = obj.length, index = 0, minMax = obj[0];
			switch (action){
				case "min":
					while (i--) {
						if (obj[i] < minMax) {
							minMax = obj[i];
							index = i;
						}
					}
				break;
				case "max": 
					while (i--) {
						if (obj[i] > minMax) {
							minMax = obj[i];
							index = i;
						}
					}
				break;
			}
			return minMax;
		} //  end minMaxFinder
	
}

module.exports = Dots;
