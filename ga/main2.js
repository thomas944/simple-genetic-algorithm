var canvasHeight = 400;
var canvasWidth = 500;

var objectiveHeight = 30;
var objectiveWidth = 70;

var howManySteps = 500;

var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(updateCanvas, 20);
        this.frameNo = 0;
    },
    clear : function(){
        this.context.clearRect(0, 0, canvasWidth, canvasHeight);
    },
    stop : function(){
        clearInterval(this.interval);
    }
}

class Vector{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}
class Dot{
    constructor(objX, objY){
        this.brain = new Brain(howManySteps);

        this.pos = new Vector(canvasWidth/2, 200);
        this.vel = new Vector(0,0);
        this.acc = new Vector(0,0);

        this.spawn = true;
        this.dead = false;

        this.ObjX = objX;
        this.ObjY = objY;
        this.safe = false;
    }

    print(){
        console.log("hi")
    }

    show(){
        this.ctx = myGameArea.context;
        this.ctx.fillStyle = "blue";
        if (this.spawn){
            this.ctx.fillRect(250,200,10,10);
            this.spawn = false;
        }
        if (this.dead){
            this.ctx.fillStyle = "red";
            this.ctx.fillRect(this.pos.x, this.pos.y, 10, 10);
        }
        else{
            this.ctx.fillRect(this.pos.x, this.pos.y, 10, 10);
        }
    }

    move(){
        if(this.brain.directions.length-1 > this.brain.steps){
            this.acc.x = this.brain.directions[this.brain.steps].x;
            this.acc.y = this.brain.directions[this.brain.steps].y;
            this.brain.steps +=1;
        } 
        else{
            this.dead = true;
        }
        this.vel.x = this.vel.x + this.acc.x;
        this.vel.y = this.vel.y + this.acc.y;
        this.vel.x = limitVelocity(this.vel.x);
        this.vel.y = limitVelocity(this.vel.y);
        this.pos.x = this.pos.x + this.vel.x;
        this.pos.y = this.pos.y + this.vel.y;
        //console.log(this.vel.x + this.acc.x);
    }

    updatePosition(){
        var dotLeft = this.pos.x;
        var dotRight = this.pos.x + (10);
        var dotTop = this.pos.y;
        var dotBottom = this.pos.y+10;
        var ObjLeft = this.ObjX;
        var ObjRight = this.ObjX + objectiveWidth;
        var ObjTop = this.ObjY;
        var ObjBottom = this.ObjY + objectiveHeight;
        //this.safe = true;
        //console.log(ObjRight);

        if(!this.dead && !this.safe){
            this.move();
            if ((this.pos.x < 10 ) || (this.pos.x > canvasWidth-10) || (this.pos.y < 10) || (this.pos.y > canvasHeight-10)){
                this.dead = true;
            }    
            if (((dotRight > ObjLeft) && (dotRight < ObjRight) && (dotTop < ObjBottom)) || ((dotLeft < ObjRight) && (dotLeft > ObjLeft) && (dotTop < ObjBottom))){
                this.safe = true;
            }    
        }

    }

    calculateFitness(){
        this.distanceFromObj = Math.sqrt((Math.pow(Math.abs(this.pos.x-this.ObjX),2)) + (Math.pow(Math.abs(this.pos.y-this.ObjY),2)))
        this.fitness = 1/(this.distanceFromObj * this.distanceFromObj);

        return this.fitness;
    }

    crossOver(){
        this.hybridBaby = new Dot((canvasWidth/2)-30,0);
        this.hybridBaby.brain.clone();
        return this.hybridBaby;
    }

}

class Brain{
    constructor(size){
        this.directions = [];
        this.steps = 0;
        var i;

        for (i=0; i<size; i+=1){
            this.directions.push(new Vector(1*flip(0,1)*Math.random(), 1*flip(0,1)*Math.random()));
            //console.log(this.directions);
        }

    }

    clone(){
        var i;
        this.clone = new Brain(this.directions.length);

        for(i=0; i<this.directions.length; i+=1) {
            this.clone.directions[i] = this.directions[i];
        }
        return this.clone;   
    }

    mutate(){
        var mutationRate = 0.01;
        var i;
        var howManyChanges = this.directions.length * mutationRate;
        var tempArray = [];
        for (i=0 ;i<howManyChanges; i++){
            tempArray.push(new Vector(1*flip(0,1)*Math.random(), 1*flip(0,1)*Math.random()));
        }

        for (i=0; i<howManyChanges; i++){
            var indexToBeChanged = getRandomInt(0,this.directions.length);
            this.directions[indexToBeChanged] = tempArray[i];
        }
    }
    
}

class Population{
    constructor(size){
        var i;
        this.reachedGoal = 0;
        this.ObjX = (canvasWidth/2)-30;
        this.ObjY = 0;
        this.fitnessSum = 0;
        this.size = size;
        this.generation = 1;

        this.population = [];
        for(i=0; i<size; i+=1){
            this.population.push(new Dot((canvasWidth/2)-30,0));
        }

        this.seen = [];
        for(i=0; i<size; i+=1){
            this.seen[i] = 0;
        }    

    }
    show(){
        var i;

        for(i=0; i<this.population.length; i+=1){
            this.population[i].show();
        }
    }
    updatePosition(){
        var i;
        for(i=0; i<this.population.length; i+=1){
            this.population[i].updatePosition();
        }
    }

    calculateFitnessPop(){
        var i;
        var sum = 0;
        for(i=0; i<this.population.length; i+=1){
            this.population[i].calculateFitness();
            //console.log(this.population[i].calculateFitness());
            sum += this.population[i].calculateFitness();
        }
        this.fitnessSum = sum;
        return sum;
    }


    allDotsDead(){
        var i;
        for(i=0; i<this.population.length; i+=1){
            if(!this.population[i].dead && !this.population[i].safe){
                return false;
                
            } 
        }
        return true;       
    }

    displayStats(){
        var i;
        
        for(i=0; i<this.population.length; i+=1){
            if(this.population[i].safe && this.seen[i] !== 1){
                this.seen[i] = 1;
                this.reachedGoal +=1;
            }
            
        }

        this.ctx = myGameArea.context;
        this.ctx.font = "30px consolas";
        this.ctx.fillStyle = "black";
        this.ctx.text = "SCORE: " + this.reachedGoal;
        this.ctx.fillText(this.ctx.text, 100, 100);   
    }


    selectParent(){
        var temp = getRandFloat(0,this.fitnessSum);
        //console.log(temp);
        var tempSum = 0;
        var i;
        for (i=0; i<this.population.length; i+=1){
            tempSum += this.population[i].calculateFitness();
            //console.log(this.population[i].calculateFitness());
            //console.log(tempSum);
            if (tempSum > temp){
                //console.log("BREAK")
                return this.population[i];
            }
        }
        return null;
    }

    naturalSelection(){
        this.newPopulation = [];
        var i;      
        this.parent = null;

        for (i=0; i<this.population.length; i+=1){
            this.newPopulation.push(new Dot((canvasWidth/2)-30,0));
        }

        for (i=0; i<this.newPopulation.length; i+=1){

            // var temp = getRandFloat(0,this.fitnessSum);
            // var tempSum = 0;
            // var j;
            // for (j=0; j<this.population.length; j+=1){
            //     tempSum += this.population[j].calculateFitness();
            //     if (tempSum > temp){
            //         break;
            //     }
            // } 
            // this.parent = this.population[j-1];
            // this.newPopulation[i] = this.parent;
            this.parent = this.selectParent();
            this.newPopulation[i] = this.parent.crossOver();
        
            //console.log(j);
            //console.log(this.population[j].calculateFitness());
            //this.newPopulation[i] = this.parent.crossOver();
        }
        //console.log(this.population);
        //console.log(this.newPopulation);
        // for (i=0; i<this.newPopulation.length; i+=1){
        //     this.newPopulation[i].crossOver();
        // }
        // console.log(this.newPopulation);

        //this.population = this.newPopulation.clone();
        this.population = this.newPopulation;
        //console.log(this.population);
        this.generation +=1;

    }

    mutate(){
        var i;
        for (i=0; i<this.population.length; i++){
            this.population[i].brain.mutate();
        }
    }
    
}

class Objective{
    constructor(x,y,height,width){
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
    }
    show(){
        this.ctx = myGameArea.context;
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillStyle = "green"; 
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min)) + min;
}
function getRandFloat(min, max){
    return (Math.random() * (max - min) + min);
}

function flip(min, max) {
    if ((Math.floor(Math.random() * (max - min + 1) ) + min) === 0){
         return -1;
    }
    else{ return 1; } 
}

function limitVelocity(currentVelocity){
    if (currentVelocity >= 5){
        return 5;
    }
    if (currentVelocity <= -5){
        return -5;
    }
    return currentVelocity;
}

var myPopulation;
var myObjective;

function startGame(){
    myGameArea.start();
    myPopulation = new Population(10);
    myObjective = new Objective((canvasWidth/2)-30,0,objectiveHeight,objectiveWidth);
}

function updateCanvas(){
    myGameArea.clear();

    if (myPopulation.allDotsDead()){
        myGameArea.stop();
        console.log(myPopulation.calculateFitnessPop())
        //console.log(myPopulation);
        //console.log(myPopulation.selectParent());
        myPopulation.naturalSelection();
        myPopulation.mutate();
    
    }
    myPopulation.displayStats();
    myPopulation.show(); 
    myPopulation.updatePosition();
    myObjective.show();
    

}