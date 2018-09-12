const $ = document.querySelector.bind(document);
const onEv = (s,ev,f) => {
    if(s !== 'document')
        [...document.querySelectorAll(s)].map((el) => {  el.addEventListener(ev, f);  });
    else
        document.addEventListener(ev, f);
}
const gc = (el) => el.getContext('2d');

let game = new Game();

onEv('.btnMove', 'click', function(e){
    let w = e.target.id.substr(7,1);
    game.buttonInput(w);
});
onEv('document', "keyup", function(event) {
    game.keyboardInput(event.keyCode);
});
onEv('#moveBtnNET', 'click', function(){
    game.toggleNet();
});
onEv('#moveBtnRA', 'click', function(){
    game.toggleEnemy(); 
});
onEv('#inst_wrap', 'click', function(){
    $('#inst_wrap').style = 'display:none';
});

function Game(){
    let rn = function(no, pl){ 
        return (pl)? Math.floor(Math.random() * no)+pl : Math.floor(Math.random() * no); 
    };
    let players = [];
    let faces = [];
    let army = [[1,2], [3,4]];
    let markedArmy = 0;
    let markedPlayer = 0;
    let nextGameMove = -1;
    //-1 game did not start
    //0 pick a player 
    //1 move a player
    let enemyType = 0, enemyPick = true, cpuArmy = 1;

    let convId = 0;        
    let convInProgress = false;

    let mapAvailableMoves = [];
    let mapCoins = [];  //check coin on coords
    let mapLegend = {};  //find coords of coin
    let firstCoin = [, 'A', 'E', '1', '5'];
    let nextCoin = [, 'A', 'E', '1', '5'];
    let prevCoin = [, 'W', 'X', 'Y', 'Z'];
    const lastCoin = [, 'C', 'C', '3', '3'];
    const canvasWidth = 600, canvasHeight = 600;
    const mapSizeR = 6, mapSizeC = 12;
    const map = [
        "W.......2....|..5.....Y", 
        "---|--|---|-", 
        "..E|7............|....A", 
        "|----|---|--", 
        "....................F..", 
        "|----|-|--|-", 
        ".....|B....|...........", 
        "-|---|-|----", 
        "3...........6|.........",
        "-|---|-|----",
        "X.....G|1.........C...Z"
    ];
    const x0 = 5, y0 = 5; 
    const wCellpx = 50, hCellpx = 50;
    const fontSize = 20;
    const fontStyle = "18px Comic Sans MS, cursive, TSCu_Comic, sans-serif";
    const plColors = ["Black", "Aqua", "Blue", "Coral", "Red"];
    let htmlMoves = $('#movesleft');
    const convsDiv =  $('#conversation');
    const GI = $('#gameinfo');
    let cGamesFinished = 0;
    let allTOplays = [];
    let firstTime = true;
    
    let allAvPaths = [];
    let succPath = '';
    const mapctx = gc( $('#cnvMap') );
    const netctx = gc( $('#cnvNet') );
    const elctx = gc( $('#cnvEl') );
    const bkcwctx = gc( $('#bckWired') );
    const dicecnv = $('#cnvDice');
    const dicectx = gc( dicecnv );
    const btnsL = ['R', 'L',  'U', 'D', 'E', 'G', 'NET', 'I', 'RA'], btnsctx = {};
    for(let i=0;i<9;i++)
        btnsctx[btnsL[i]] = gc( $('#moveBtn'+btnsL[i]) );
    drawButtons();
    loadInstructions();
    drawWiredBck(bkcwctx);
    initConversation();

    (function initMap(){
        //reset map
        for(let i=0;i<mapSizeR; i++){
            mapAvailableMoves[i] = []; 
            for(let j=0; j<mapSizeC; j++){
                mapAvailableMoves[i][j] = ""; //LRDU
            }
        }
        for(let i=0;i<map.length; i++){
            if(i%2 == 0){
                for(let j=0; j<map[i].length; j+=2){
                    if(map[i].substr(j+1,1) == "."){
                        mapAvailableMoves[i/2][j/2] += "R"; 
                        mapAvailableMoves[i/2][j/2+1] += "L"; 
                    }
                }
            }else{
                for(let j=0; j<map[i].length; j++){
                    if(map[i].substr(j,1) == "|"){
                        mapAvailableMoves[(i-1)/2][j] += "D"; 
                        mapAvailableMoves[(i-1)/2+1][j] += "U"; 
                    }
                }
            }
        }
        drawWires();
        resetGame();
    })();

    function resetGame(){
        for(let i in allTOplays)
            if(allTOplays[i])
                clearTimeout(allTOplays[i]);
        //reset map
        for(let i=0;i<mapSizeR; i++){
            mapCoins[i] = [];
            for(let j=0; j<mapSizeC; j++)
                mapCoins[i][j] = '';
        }
        //set map
        drawWires();
        if(!firstTime && createRndCoinsMap()) drawRndMap(); 
        else setMap();

        drawDice(0, 6); drawDice(1, 6);
        
        //players
        let ctx = [];
        for(let i=0; i<=4; i++){
            ctx[i] = gc( $('#pl'+i) );
            players[i] = new Player(ctx[i], plColors[i]);
            if(i>0)
                players[i].drawPlayerCoords(mapLegend[prevCoin[i]][0], mapLegend[prevCoin[i]][1]);
        }
        players[0].removePlayer();
        measureDistForAllPlayers();

        nextGameMove = -1;
        enemyPick = true;
    };

    function newGame(){
        if(nextGameMove >= 0){
            var a = confirm('New game? You resign? Really?');
            if(a == false) return; 
        }
        nextCoin = [, 'A', 'E', '1', '5'];
        prevCoin = [, 'W', 'X', 'Y', 'Z'];
        
        resetGame();

        firstTime = false;
        enemyPick = false;
        diceNumbers = [0,0]; diceNo = 0;
        markedArmy = 1;
        markedPlayer = 0;
        nextGameMove = -1;
        rndDice(2);
        changeNextGameMove();
        if(cGamesFinished > 0)
            setConv('newGame');  
    }



    /********************************************************************
    **
    **  Game
    **
    ********************************************************************/
    this.newGame = newGame;
    let netVis = false;
    //expose
    this.toggleNet = function(){
        netVis = !netVis;
        netctx.clearRect(0, 0, canvasWidth, canvasHeight);
        if(netVis) tableFields(netctx);
    }
    this.toggleEnemy = function(){
        if(!enemyPick){ 
            var a = confirm('You can change opponent only if you finish the game or resign. '+
                    'Do you want to resign?');
            if(a == false) return;
        }
        enemyType = 1 - enemyType;
        drawEnemyTypeBtn();
        nextGameMove = -1;
        enemyPick = true;
    }
    let userKeyInput = "";
    this.buttonInput = function(w){
        userInput(w);
    }
    this.keyboardInput = function(key){
        let char = String.fromCharCode(key);
        userKeyInput += char;
        if(userKeyInput.toUpperCase().indexOf('YES') >= 0){
            userKeyInput = '';
            setConv('rulesMakeFun');
        }
        let w =  (key == 13 || key == 32)? 'E' :
                (key == 37)? 'L' :
                   (key == 38)? 'U' :
                   (key == 39)? 'R' : 
                   (key == 40)? 'D' : '';
        userInput(w);
    }

    function userInput(w){
        if(w == 'I'){
            $('#inst_wrap').style = "display:block";
        }
        if(w == 'G'){
            newGame();
        }
        if(nextGameMove == -1) return;
        if(enemyType == 0 && markedArmy == cpuArmy) return;
        if(w == 'E'){
            changeNextGameMove();  
            return;
        }
        if(w != ''){
            if(nextGameMove == 1)
                movePlayer(w);
            if(nextGameMove == 0)
                changeMarkedPlayer(false);
        }
    }
    function changeNextGameMove(){
        if(nextGameMove === 1 && (diceNumbers[0] > 0 || diceNumbers[1] > 0))
            return;
        nextGameMove = (nextGameMove+1) % 2;
        if(nextGameMove == 0)
            changeMarkedArmy();
        if(enemyType == 0 && markedArmy == cpuArmy) 
            GI.innerHTML = 'Wait for your turn';
        else
            if(nextGameMove === 1)
                GI.innerHTML = 'Move a player';
            else
                GI.innerHTML = 'Pick a player';
    }
    
    function movePlayer(where){
        let plNo = army[markedArmy][markedPlayer];
        players[plNo].endMoveInProgress();
        let coords = players[plNo].getCoords();
        if(!canMove(coords[0], coords[1], where)) return;
        if(diceNumbers[diceNo] == 0) return;
        diceNumbers[diceNo]--;
        showDiceNumber(diceNo);

        //MOVE BOY
        let cr = players[plNo].movePlayer(where);
        if(mapCoins[cr[0]][cr[1]] === nextCoin[plNo]){
            writeLetter(nextCoin[plNo], "", cr[0], cr[1], false);
            players[plNo].distance = 0;
            prevCoin[plNo] = nextCoin[plNo];
            if(nextCoin[plNo] === lastCoin[plNo]){
                if(players[plNo].canKill === false){
                    players[plNo].canKill = true;
                    alert('This player can kill now!!');
                    //draw a gun over his head!

                }
            }else
                nextCoin[plNo] = String.fromCharCode(nextCoin[plNo].charCodeAt(0)+1);
        }

        if(diceNumbers[diceNo] == 0){
            setTimeout( () => { 
                if(checkElectrify(cr, true) === false)
                    endMove();
            }, 1000 );
        }
    }
    function endMove(){
        diceNo++;
        if(diceNo > 1){
            let no = (players[army[1-markedArmy][0]].isDead() || 
                      players[army[1-markedArmy][1]].isDead())?
                1 : 2;
            rndDice(no);
            diceNo = 0;
            changeNextGameMove();            
        }else{
            changeMarkedPlayer(true);
            showDiceNumber(diceNo);
        }
        if(enemyType == 0 && cpuArmy == markedArmy)
            setTimeout(()=> cpuPlay(), 1100);
    }

    let elecPls = [];
    function checkElectrify(coords, elNow){
        let enemy = 1 - markedArmy;
        let c = [];
        let elec = [];
        elecPls = [];
        for(let i=1; i<=2; i++){
            let plNo = army[enemy][i-1];
            c[i] = players[plNo].getCoords();
        }
        for(let i=1; i<=2; i++){
            let plNo = army[enemy][i-1];
            if(players[plNo].isDead()) continue;
            //is enemy on the same field
            if((c[i][0] === coords[0]) && (c[i][1] === coords[1])){
                let coordsE = mapLegend[prevCoin[plNo]];
                if(elNow == true){
                    if(players[army[markedArmy][markedPlayer]].canKill === false){
                        players[plNo].drawPlayerCoords(coordsE[0], coordsE[1]);
                        players[plNo].distance = 0;
                    }else{
                        players[plNo].playerDied();
                        checkGameEnd(army[markedArmy][markedPlayer]);
                    }
                }else 
                    elec.push([c[i][0], c[i][1], 0, plNo]);
            }else{
                let ch = false, rh = false, j, w, s, distance;
                if(c[i][0] === coords[0]){
                    w = (c[i][1] > coords[1])? 'R':'L';
                    s = (c[i][1] > coords[1])? 1:-1;
                    for(j=coords[1], ch=true; (s>0 && j<c[i][1])||(s<0 && j>c[i][1]); j+=s)
                        ch = ch && (mapAvailableMoves[coords[0]][j].indexOf(w) >= 0);
                    distance = Math.abs(c[i][1]-coords[1]);          
                }
                if(c[i][1] === coords[1]){
                    w = (c[i][0] > coords[0])? 'D':'U';
                    s = (c[i][0] > coords[0])? 1:-1;
                    for(j=coords[0], rh=true; (s>0 && j<c[i][0])||(s<0 && j>c[i][0]); j+=s)
                        rh = rh && (mapAvailableMoves[j][coords[1]].indexOf(w) >= 0);
                    distance = Math.abs(c[i][0]-coords[0]);          
                }
                if(ch === true || rh === true)
                    elec.push([c[i][0], c[i][1], distance, plNo]);
            }
        }
        if(elec.length > 0){
            //dont electrify both players, just the closer one
            let ind = (elec.length == 1)? 0 : 
                    (elec[0][2] < elec[1][2])? 0 : 1; 

            //closer enemy is on his last OFFLINE field?
            //then he protects the one behind him
            if(mapCoins[elec[ind][0]][elec[ind][1]] === prevCoin[elec[ind][3]])
                return false;            
            
            //are they on the same field???
            if(elec.length == 2 && elec[0][0] === elec[1][0] && elec[0][1] === elec[1][1]){
                //if one of them is on his last OFFLINE field, he protects the other
                if(mapCoins[elec[ind][0]][elec[ind][1]] === prevCoin[elec[ind][3]] ||
                mapCoins[elec[1-ind][0]][elec[1-ind][1]] === prevCoin[elec[1-ind][3]])
                    return false;
                elecPls.push(elec[1-ind][3]); //electrify both
            }

            //save plNo to electrify
            elecPls.push(elec[ind][3]); 
            if(elNow)
                moveElectr(coords[0], coords[1], elec[ind][0], elec[ind][1]);
            return true;
        }
        return false;
    }
       
    function elPlToHisLastCoin(){
        let plNo = army[markedArmy][markedPlayer];
        if(players[plNo].canKill === false)
            for(let i=0; i<elecPls.length; i++){
                let coords = mapLegend[prevCoin[elecPls[i]]];
                players[elecPls[i]].drawPlayerCoords(coords[0], coords[1]);
                players[elecPls[i]].distance = 0;
            }
        else
            for(let i=0; i<elecPls.length; i++){
                players[elecPls[i]].playerDied();
                checkGameEnd(plNo);
            }
        if(elecPls.length > 0)
            if(elecPls[0]<3) setConv('meElectr', elecPls[0]);
            else setConv('enemyElectr', elecPls[0]);

        endMove();
    }

    function checkGameEnd(plNo){
        let enemy = 1 - markedArmy;
        if(players[army[enemy][0]].isDead() && players[army[enemy][1]].isDead())
            showGameEnd(plNo);
    }

    function showGameEnd(plNo){
        cGamesFinished++;
        nextGameMove = -1;
        if(plNo < 3){
            let msg = 'Game over. You WIN!!!!';
            alert(msg);
            GI.innerHTML = msg;
            setConv('winGame');          
        }else{
            msg = 'Game over. You LOST!';
            alert(msg);
            GI.innerHTML = msg;  
            setConv('lostGame');          
        }
        enemyPick = true;
    }

    function changeMarkedArmy(){
        markedArmy = 1 - markedArmy;
        let plNo = army[markedArmy][0];
        markedPlayer = (!players[plNo].isDead())? 0 : 1;
        let unmarkedPlayer = army[markedArmy][1-markedPlayer];
        if(players[unmarkedPlayer].isDead()) //set him to play without <Enter> click
            nextGameMove = 1;
        drawMarkedPlayer();
    }
    function changeMarkedPlayer(changeArmy){
        markedPlayer = 1 - markedPlayer;
        let plNo = army[markedArmy][markedPlayer];
        if(!players[plNo].isDead()) 
            drawMarkedPlayer();
        else
            if(changeArmy){
                diceNumbers[1] = 0;
                endMove();
            }else{
                markedPlayer = 1 - markedPlayer;
            }
    }
    function drawMarkedPlayer(){
        let plNo = army[markedArmy][markedPlayer];
        for(let i=1; i<=4; i++)
            players[i].delMark();
        players[plNo].drawMark();
    }
    /********************************************************************
    **
    **  DRAWINGS
    **
    ********************************************************************/


    function fuzz(x, f){
        return x + Math.random()*f - f/2;
    }

    // estimate the movement of the arm
    // x0: start
    // x1: end
    // t: step from 0 to 1
    function handDrawMovement(x0, x1, t){
        return x0 + (x0-x1)*(
                15*Math.pow(t, 4) -
                6*Math.pow(t, 5) -
                10*Math.pow(t,3)
        )
    }

    // hand draw a circle
    // ctx: Context2D
    // x, y: Coordinates
    // r: radius
    function handDrawCircle(ctx, x, y, r, rb, re){
        let steps = Math.ceil(Math.sqrt(r)*3);

        // fuzzyness dependent on radius
        let f = 0.12*r;

        // distortion of the circle
        let xs = 1.0+Math.random()*0.1-0.05;
        let ys = 2.0-xs;

        let b = (rb || rb>0)? Math.ceil(steps*rb)+1 : 1;
        let e = (re || re>0)? Math.ceil(steps*re) : steps;
        
        ctx.moveTo(x+r*xs, y);

        for(let i = b-1; i <= e ; i++)
        {
            let t0 = (Math.PI*2/steps)*(i-1);
            let t1 = (Math.PI*2/steps)*i;
            let x0 = x+Math.cos(t0)*r*xs;
            let y0 = y+Math.sin(t0)*r*ys;
            let x1 = x+Math.cos(t1)*r*xs;
            let y1 = y+Math.sin(t1)*r*ys;
            if(i>b-1)
                ctx.quadraticCurveTo(fuzz(x0, f), fuzz(y0, f), x1, y1);
            ctx.moveTo(x1, y1);
        }
    }

    // inspired by this paper
    // http://iwi.eldoc.ub.rug.nl/FILES/root/2008/ProcCAGVIMeraj/2008ProcCAGVIMeraj.pdf
    function handDrawLine(ctx, x0, y0, x1, y1){
        ctx.moveTo(x0, y0);

        let d = Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));

        let steps = d/25;
        if(steps < 4) {
            steps = 4;
        }

        // fuzzyness
        let f = 8.0;
        for(let i = 1; i <= steps; i++)
        {
            let t1 = i/steps;
            let t0 = t1-1/steps
            let xt0 = handDrawMovement(x0, x1, t0)
            let yt0 = handDrawMovement(y0, y1, t0)
            let xt1 = handDrawMovement(x0, x1, t1)
            let yt1 = handDrawMovement(y0, y1, t1)
            ctx.quadraticCurveTo(fuzz(xt0, f), fuzz(yt0, f), xt1, yt1)
            ctx.moveTo(xt1, yt1)
        }

    }
    function handDrawRect(ctx, x0, y0, x1, y1, r){
        for(var i=0;i<r;i++){
            handDrawLine(ctx, x0, y0, x0, y1);
            handDrawLine(ctx, x0, y0, x1, y0);
            handDrawLine(ctx, x1, y1, x0, y1);
            handDrawLine(ctx, x1, y1, x1, y0);
        }
    }
    /********************************************************************
    **
    **  MAP
    **
    ********************************************************************/
    function tableFields(){
        netctx.beginPath();
        netctx.clearRect(0,0,canvasWidth,canvasHeight);
        netctx.strokeStyle= "#aaa";
        let endY = y0 + mapSizeR * hCellpx;
        let x = x0;
        for(let i=0; i<=mapSizeC; i++){
            handDrawLine(netctx, x, y0, x, endY);
            x += wCellpx;
        }

        let endX = x0 + mapSizeC * wCellpx;
        let y = y0;
        for(let i=0; i<=mapSizeR; i++){
            handDrawLine(netctx, x0, y, endX, y);
            y += hCellpx;
        }
        netctx.stroke();
    }

    function canMove(r,c,w){
        return (mapAvailableMoves[r][c].indexOf(w) >= 0);
    }

    function drawWires(){
        mapctx.beginPath();
        mapctx.clearRect(0,0,canvasWidth,canvasHeight);
        mapctx.strokeStyle= "#000";
        for(let i=0;i<map.length; i++){
            if(i%2 == 0)
                for(let j=0; j<map[i].length; j+=2){
                    if(map[i].substr(j+1,1) == ".")
                        drawWireHor(i/2, j/2);
                    drawBarb(i/2, j/2);
                }
            else
                for(let j=0; j<map[i].length; j++)
                    if(map[i].substr(j,1) == "|")
                        drawWireVer(parseInt(i/2), j);
        }
        mapctx.stroke();
    }
    function setMap(){
        let startChars = "WXYZ";
        let coords = [[0,0]];
        for(let i=0;i<map.length; i+=2)
            for(let j=0; j<map[i].length; j+=2)
                if(map[i].substr(j,1) != "."){
                    let c = startChars.indexOf(map[i].substr(j,1));
                    mapLegend[map[i].substr(j,1)] = [i/2, j/2];                        
                    if(c < 0){
                        let ltr = map[i].substr(j,1);
                        let clr = getLetterClrPart(ltr);
                        writeLetter(ltr, clr, i/2, j/2, true);
                        mapCoins[i/2][j/2] = map[i].substr(j,1);
                    }else{
                        writeStart(plColors[c+1], i/2, j/2, true);
                        mapCoins[i/2][j/2] = map[i].substr(j,1);
                        coords[c+1] = [i/2,j/2];
                    }
                }
        return coords;
    }
    function getLetterClrPart(ltr){
        if(ltr >= 'A' && ltr <= 'D') return plColors[1];
        if(ltr >= 'E' && ltr <= 'H') return plColors[2];
        if(ltr >= '1' && ltr <= '4') return plColors[3];
        if(ltr >= '5' && ltr <= '8') return plColors[4];
    }
    function hdlRepeat(ctx, x1,y1,x2,y2,rep){
        for(let i=0;i<rep;i++)
            handDrawLine(ctx, x1,y1,x2,y2);
    }
    function drawWireHor(r, c){
        let x = x0 + c * wCellpx + wCellpx / 2;
        let endX = x0 + (c+1) * wCellpx + wCellpx / 2;
        let y = y0 + (r+1) * hCellpx;
        hdlRepeat(mapctx, x, y, endX, y,3);
    }
    function drawWireVer(r, c){
        let y = y0 + (r+1) * hCellpx;
        let endY = y0 + (r+2) * hCellpx;
        let x = x0 + c * wCellpx + wCellpx / 2;
        hdlRepeat(mapctx, x, y, x, endY,3);
    }
    function drawBarb(r, c){
        let y = y0 + (r+1) * hCellpx + 5;
        let endY = y0 + (r+1) * hCellpx - 5;
        let x = x0 + c * wCellpx + wCellpx / 2 - 5;
        let endX = x0 +c * wCellpx + wCellpx / 2 + 5;
        hdlRepeat(mapctx, x, y, endX, endY,3);
    }

    function writeLetter(letter, clr, r, c, full){
        let x = x0 + c * wCellpx + wCellpx / 2;
        let y = y0 + r * hCellpx + (hCellpx - fontSize)-2;
        mapctx.clearRect(x - fontSize/2, y - fontSize/2, 
                      fontSize, fontSize);
        if(full === true){
            mapctx.beginPath();
            mapctx.arc(x, y, fontSize/2 + 1, 0, 2 * Math.PI, false);
            mapctx.fillStyle = clr;
            mapctx.fill();
        }
        mapctx.beginPath();
        handDrawCircle(mapctx, x, y, fontSize/2 + 2);
        mapctx.font = fontStyle; 
        mapctx.textAlign="center"; 
        mapctx.fillStyle = "#000";
        mapctx.fillText( letter, x, y + 8);
        mapctx.stroke();
    }

    function writeStart(clr, r, c, full){
        let x = x0 + c * wCellpx + wCellpx / 2;
        let y = y0 + (r+1) * hCellpx;
        mapctx.beginPath();
        mapctx.font = fontStyle; 
        mapctx.textAlign="center"; 
        mapctx.fillStyle = clr;
        mapctx.fillText("s", x, y);
        mapctx.stroke();
    }

    function drawButtons(){
        let wB = 40, hB = 40;
        for(let i=0;i<4;i++){
            let l = btnsL[i];
            btnsctx[l].beginPath();
            btnsctx[l].fillStyle = 'Gainsboro';
            btnsctx[l].fillRect(2,2,wB-2, hB-2);
            btnsctx[l].fill();
            if(i<2)
                hdlRepeat(btnsctx[l], wB/6, hB/2, wB*5/6, hB/2, 2);
            else
                hdlRepeat(btnsctx[l], wB/2, hB/6, wB/2, hB*5/6, 2);
            handDrawRect(btnsctx[l], 1,1,wB-1,hB-1, 2);
        }

        //arrows:
        for( let i=0;i<2;i++){
            let l = btnsL[i];
            let b = (i==1)? wB/6 : wB*5/6;
            handDrawLine(btnsctx[l], b, hB/2, wB/2, hB/4);
            handDrawLine(btnsctx[l], b, hB/2, wB/2, hB*3/4);
        }
        for( let i=2;i<4;i++){
            let l = btnsL[i];
            let b = (i==2)? hB/6 : hB*5/6;
            handDrawLine(btnsctx[l], wB/2, b, wB/4, hB/2);
            handDrawLine(btnsctx[l], wB/2, b, wB*3/4, hB/2);
        }
        for(let i=4;i<9;i++){
            let l = btnsL[i];
            btnsctx[l].beginPath();
            btnsctx[l].fillStyle = 'Gainsboro';
            btnsctx[l].fillRect(2,2,wB*3+2, 28);
            btnsctx[l].fill();
            handDrawRect(btnsctx[l], 1,1,wB*3+4,27, 2);
        }
        btnsctx.G.strokeText("NEW GAME",34,20);
        btnsctx.NET.strokeText("NET on/off",37,20);
        btnsctx.E.strokeText("PICK player",37,20);
        btnsctx.I.strokeText("INSTRUCTIONS",23,20);
        btnsctx.RA.strokeText("Enemy:",5,10);
        for(let i=0;i<btnsL.length;i++)
            btnsctx[btnsL[i]].stroke();
        drawEnemyTypeBtn();
    }
    function drawEnemyTypeBtn(){
        btnsctx.RA.beginPath();
        btnsctx.RA.fillStyle = 'Gainsboro';
        btnsctx.RA.fillRect(10,14,100,10);
        btnsctx.RA.fill();
        btnsctx.RA.beginPath();
        let x = (enemyType==0)? 13 : 55;
        btnsctx.RA.arc(x, 20, 3, 0, 2 * Math.PI, false);
        btnsctx.RA.fillStyle = 'black';
        btnsctx.RA.fill();
        btnsctx.RA.strokeText("CPU",20,23);
        btnsctx.RA.strokeText("Human",64,23);
        handDrawCircle(btnsctx.RA, 13, 20, 5);
        handDrawCircle(btnsctx.RA, 55, 20, 5);
        btnsctx.RA.stroke();
    }
    function drawWiredBck(ctx){
        let fH = 140, fW = 60;
        ctx.beginPath();
        ctx.strokeStyle = "#DEDEDE";
        let x0 = 30, y0 = 140, pomX = 5;
        let xp0 = 30, yp0 = 140;
        for(let i=0; i<5; i++){
          //W
          handDrawLine(ctx, xp0, y0, xp0+fW/2, y0+fH);
          handDrawLine(ctx, xp0+fW/2, y0+fH, xp0+fW, y0+fH/2);
          handDrawLine(ctx, xp0+fW, y0+fH/2, xp0+fW+fW/2, y0+fH);
          handDrawLine(ctx, xp0+fW+fW/2, y0+fH, xp0+fW*2, y0);
          //I
          handDrawLine(ctx, xp0+fW*3, y0, xp0+fW*3, y0+fH);
          //R
          handDrawLine(ctx, xp0+fW*4, y0, xp0+fW*4, y0+fH);
          handDrawLine(ctx, xp0+fW*4.5, y0+fH/2, xp0+fW*5, y0+fH);
          handDrawCircle(ctx, x0+fW*4.5, y0+fH/4, fH/4-(i*pomX));
          //E
          handDrawLine(ctx, xp0+fW*6, y0, xp0+fW*6, y0+fH);
          handDrawLine(ctx, x0+fW*6, yp0, x0+fW*7, yp0);
          handDrawLine(ctx, x0+fW*6, y0+fH/2-(i-2)*pomX, 
                      x0+fW*6+fW*3/4,  y0+fH/2-(i-2)*pomX);
          handDrawLine(ctx, x0+fW*6, y0+fH-i*pomX, x0+fW*7, y0+fH-i*pomX);
          //D
          handDrawLine(ctx, xp0+fW*7.5, y0, xp0+fW*7.5, y0+fH);
          handDrawLine(ctx, x0+fW*7.5, yp0, x0+fW*7.5+fW/2, yp0);
          handDrawLine(ctx, x0+fW*7.5, y0+fH-i*pomX, x0+fW*7.5+fW/2, y0+fH-i*pomX);
          //samo jos polukrug
          handDrawCircle(ctx, x0+fW*7.5+fW/3, y0+fH/2, fH/2-(i*pomX), .75, 1);
          handDrawCircle(ctx, x0+fW*7.5+fW/3, y0+fH/2, fH/2-(i*pomX), 0, .25);
          xp0+=pomX; yp0+=pomX;
        }
        ctx.stroke();
    }
    /********************************************************************
    **
    **  ELECTRIFY PLAYER
    **
    ********************************************************************/
    let spikesEl = 8, outerRadiusEl = 10, innerRadiusEl = 6;
    function drawElectr(cx,cy,scaleEl){
        if(!scaleEl) scaleEl = 1;
        let outerRadius = outerRadiusEl * scaleEl;
        let innerRadius = innerRadiusEl * scaleEl;
        let rot=Math.PI/2*3;
        let step=Math.PI/spikesEl;

        let x = cx, y = cy;
        elctx.clearRect(0, 0, canvasWidth, canvasHeight);
        elctx.beginPath();
        elctx.moveTo(cx,cy-outerRadius)
        for(i=0;i<spikesEl;i++){
            x=cx+Math.cos(rot)*outerRadius;
            y=cy+Math.sin(rot)*outerRadius;
            elctx.lineTo(x,y);
            rot+=step;

            x=cx+Math.cos(rot)*innerRadius;
            y=cy+Math.sin(rot)*innerRadius;
            elctx.lineTo(x,y)
            rot+=step;
        }
        elctx.lineTo(cx,cy-outerRadius);
        elctx.closePath();
        elctx.lineWidth=3;
        elctx.strokeStyle='#FFFF00';
        elctx.stroke();
        elctx.fillStyle='#FFFFcc';
        elctx.fill();
    }

    function moveElectr(r, c, er, ec){
        let cx = x0 + c * wCellpx + wCellpx/2;
        let cy = y0 + (r+1) * hCellpx;
        let endElX = x0 + ec * wCellpx + wCellpx/2;
        let endElY = y0 + (er+1) * hCellpx;
        let scaleEl = 1; 
        let moveInc = 10;
        moveElIncX = (ec > c)? moveInc: (ec<c)? -moveInc : 0; 
        moveElIncY = (er > r)? moveInc: (er<r)? -moveInc : 0; 
        animateEl(cx,cy,scaleEl, endElX, endElY);
    }

    let moveElIncX = 0, moveElIncY = 0;
    //let endElX, endElY;
    function animateEl(cx,cy,scaleEl,endElX, endElY ){
        if(scaleEl > 1) scaleEl = 1;
        else scaleEl = 2;
        drawElectr(cx+moveElIncX, cy+moveElIncY, scaleEl);
        if((moveElIncX>0 && cx>=endElX) || (moveElIncX<0 && cx<=endElX) ||
            (moveElIncY>0 && cy>=endElY) || (moveElIncY<0 && cy<=endElY)){
            drawElectrPlayer(endElX,endElY);
            //set player to his last coin coordinates

        }else
            requestAnimationFrame(() => {
                animateEl(cx+moveElIncX,cy+moveElIncY,scaleEl, endElX, endElY);
            });
    }



    function drawElectrPlayer(cx,cy){
        drawElectr(cx, cy - (hCellpx/2), 3);
        let clr = "white";
        let elInt = setInterval(()=> {
            clr = (clr === 'white')? "black" : "white"; 
            players[0].setColor(clr);
            players[0].drawPlayer(cx, cy - (2*hCellpx)/3);
        }, 100 );
        setTimeout(()=>{ 
            clearInterval(elInt); 
            //removeStar
            elctx.clearRect(0, 0, canvasWidth, canvasHeight);
            //remove black player
            players[0].removePlayer();
            //reset original player to his last coin
            elPlToHisLastCoin();
        }, 1000);
    }


    /********************************************************************
    **
    **  DICE
    **
    ********************************************************************/
    let diceNumbers = [0,0], diceNo;
    function showDiceNumber(diceNo){
        htmlMoves.innerHTML = diceNumbers[diceNo];
    }
    function rndDice(d){
        let n1,n2;
        let diceInt = setInterval(()=>{
            n1 = rn(6,1);
            n2 = rn(6,1);
            dicectx.clearRect(0,0,dicecnv.width, dicecnv.height);        
            drawDice(0, n1); 
            if(d > 1)
                drawDice(1, n2);
        }, 100);
        setTimeout(()=>{
            clearInterval(diceInt);
            diceNumbers = [n1,n2];
            showDiceNumber(0);
            diceNo = 0;
        }, 1000);
    }
    function hdfCircle(ctx,x,y,r,fill){
        handDrawCircle(ctx, x, y, r);
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    }
    function drawDice(d, n) {
        const x= d*43+2, y = 2, wDice = 40, hDice = 40, rDice = 4;
        const rNum = 4;
        dicectx.beginPath();
        dicectx.moveTo(x + rDice, y);
        dicectx.lineTo(x + wDice - rDice, y);
        dicectx.quadraticCurveTo(x + wDice, y, x + wDice, y + rDice);
        dicectx.lineTo(x + wDice, y + hDice - rDice);
        
        dicectx.quadraticCurveTo(x + wDice, y + hDice, x + wDice - rDice, y + hDice);
        dicectx.lineTo(x + rDice, y + hDice);
        dicectx.quadraticCurveTo(x, y + hDice, x, y + hDice - rDice);
        dicectx.lineTo(x, y + rDice);
        dicectx.quadraticCurveTo(x, y, x + rDice, y);
        dicectx.closePath();
        dicectx.fillStyle = "rgb(204,51,0)";
        dicectx.fill();
        dicectx.stroke();
        dicectx.beginPath();
        //dicectx.shadowBlur = 3;
        //dicectx.shadowColor = "black";
        let fD = 10;
        if(n%2 == 1)
            hdfCircle(dicectx, x+wDice /2, y+hDice/2, rNum);
        let xU = x+fD, xD = x+wDice-fD; 
        let yD1 = y+fD, yD2 = y+hDice-fD, yD3 = y+wDice/2;
        if(n%2 == 0 || n >= 4){
            hdfCircle(dicectx, xU, yD1, rNum);            
            hdfCircle(dicectx, xD, yD2, rNum);            
        }
        if(n >= 3){
            hdfCircle(dicectx, xD, yD1, rNum);            
            hdfCircle(dicectx, xU, yD2, rNum);            
        }
        if(n == 6){
            hdfCircle(dicectx, xD, yD3, rNum);            
            hdfCircle(dicectx, xU, yD3, rNum);            
        }
        dicectx.fillStyle = "white";
        dicectx.fill();
        dicectx.stroke();
    }




    /********************************************************************
    **
    **  PLAYERS
    **
    ********************************************************************/


    function Player(ctx,clr){

        let legPosX = 0, maxlegPosX = 8, plLegInc = 2;
        let ctxpp = ctx, rpp, cpp, clrpp = clr;
        
        let plAbsMove = 0, plAbsMoveInc = 2;
        let moveEndX, moveEndY;
        let moveInterval;
        let moveInProgress = -1;
        this.distance = 0;

        //expose
        (this.setColor = function(clr){
            ctxpp.strokeStyle = 'black';
            ctxpp.fillStyle = clr;
        })(clr);
        this.getCoords = function(){
            return [rpp, cpp];
        }
        this.setCoords = function(r,c){
            rpp = r; cpp = c;
        }
        this.movePlayer = function(where){
            if(where == 'L' || where == 'R'){
                let ec = (where == 'L')? cpp-1 : cpp+1;
                movePlayerLR(ec);
            }
            if(where == 'U' || where == 'D'){
                let er = (where == 'U')? rpp-1 : rpp+1;
                movePlayerUD(er);
            }
            this.distance++;
            return [rpp, cpp];
        }
        this.removePlayer = function(){
            ctxpp.clearRect(0,0,canvasWidth,canvasHeight);
        }
        this.drawPlayerCoords = drawPlayerCoords;
        this.drawPlayer = drawPlayer;
        this.endMoveInProgress = endMoveInProgress;
        this.canKill = false;
        
        let died = false;

        const radMark = 6;
        this.delMark = function(){
            let x = x0 + cpp * wCellpx;
            let y = y0 + rpp * hCellpx;
            ctxpp.clearRect(x,y-radMark*2-1,wCellpx,radMark*3+1);
        }
        this.drawMark = function(){
            ctxpp.beginPath();
            let x = x0 + cpp * wCellpx + wCellpx / 3;
            let y = y0 + rpp * hCellpx;
            ctxpp.moveTo(x,y); ctxpp.lineTo(x+wCellpx/6, y+radMark);
            ctxpp.lineTo(x+wCellpx/3, y); ctxpp.closePath();
            ctxpp.fill();
            for(let i=0;i<2;i++)
                handDrawLine(ctxpp, x+wCellpx/6, y, x+wCellpx/6, y-radMark*2, 2);
            ctxpp.stroke();
            
        }
        this.playerDied = function(){
            died = true;
            ctxpp.beginPath();
            ctxpp.clearRect(0, 0, canvasWidth, canvasHeight);
            ctxpp.fill();
            ctxpp.stroke();
        }
        this.isDead = function(){ return died; }

        function drawPlayerCoords(r, c){
            rpp = r; cpp = c;
            let x = x0 + c * wCellpx + wCellpx / 2;
            let y = y0 + r * hCellpx + hCellpx / 3;
            drawPlayer(x,y);
        }
        function drawPlayer(x,y){
            let rad = wCellpx / 6;
            ctxpp.beginPath();
            ctxpp.clearRect(0, 0, canvasWidth, canvasHeight);
            hdfCircle(ctxpp, x, y, rad);
            ctxpp.fillStyle = clrpp;
            ctxpp.fill();
            let endY = y + hCellpx / 3;
            //body
            handDrawLine(ctxpp, x, y, x, endY);
            //legs
            handDrawLine(ctxpp, x, endY, x-8, endY + hCellpx / 3);
            handDrawLine(ctxpp, x, endY, x+8, endY + hCellpx / 3);
            //arms
            handDrawLine(ctxpp, x, y+(hCellpx / 6)+5, x-8, y+(hCellpx / 6)+10);
            handDrawLine(ctxpp, x, y+(hCellpx / 6)+5, x+8, y+(hCellpx / 6)+10);
            ctxpp.stroke();
        }


    
        function drawPlayerMoveLR(){
            legPosX += plLegInc;
            if(legPosX > maxlegPosX || legPosX < 0) 
                plLegInc = -plLegInc;
            if(legPosX > maxlegPosX)  legPosX = maxlegPosX;
            if(legPosX < 0)  legPosX = 0;
            plAbsMove += plAbsMoveInc;
            let rad = wCellpx / 6;
            let x = x0 + oldcpp * wCellpx + wCellpx / 2 + plAbsMove;
            let y = y0 + rpp * hCellpx + hCellpx / 3;
            ctxpp.beginPath();
            ctxpp.clearRect(0, 0, canvasWidth, canvasHeight);
            handDrawCircle(ctxpp, x, y, rad);
            ctxpp.arc(x, y, rad-1, 0, 2 * Math.PI, false);
            ctxpp.fillStyle = clrpp;
            ctxpp.fill();
            let endY = y + hCellpx / 3;
            //body
            handDrawLine(ctxpp, x, y, x, endY);
            //legs
            handDrawLine(ctxpp, x, endY, x-maxlegPosX+legPosX, y0 + (rpp+1)*hCellpx);
            handDrawLine(ctxpp, x, endY, x+maxlegPosX-legPosX, y0 + (rpp+1)*hCellpx);
            //arms
            handDrawLine(ctxpp, x, y+(hCellpx / 6)+5, x-maxlegPosX+legPosX, y+(hCellpx / 6)+12);
            handDrawLine(ctxpp, x, y+(hCellpx / 6)+5, x+maxlegPosX-legPosX, y+(hCellpx / 6)+12);
            ctxpp.stroke();    
            if((plAbsMoveInc > 0 && x >= moveEndX) || (plAbsMoveInc < 0 && x <= moveEndX)){
                clearInterval(moveInterval);
                moveInProgress = -1;
                drawPlayerCoords(rpp, cpp);
            }
        }

        function movePlayerLR(ec){
            oldcpp = cpp; cpp = ec;
            moveEndX = x0 + ec * wCellpx + wCellpx / 2;
            plAbsMove = 0; 
            plAbsMoveInc = (oldcpp > cpp)? -3 : 3;
            moveInProgress = (oldcpp > cpp)? 1 : 2;
            moveInterval = setInterval(function(){
                drawPlayerMoveLR();
            }, 50);
        }


        function drawPlayerMoveUpDown(){
            plAbsMove += plAbsMoveInc;
            let rad = wCellpx / 6;
            let x = x0 + cpp * wCellpx + wCellpx / 2;
            let y = y0 + oldrpp * hCellpx + hCellpx / 3 + plAbsMove;
            ctxpp.beginPath();
            ctxpp.clearRect(0, 0, canvasWidth, canvasHeight);
            handDrawCircle(ctxpp, x, y, rad);
            ctxpp.arc(x, y, rad-1, 0, 2 * Math.PI, false);
            ctxpp.fillStyle = clrpp;
            ctxpp.fill();
            let endY = y + (2*hCellpx) / 3;
            //body
            handDrawLine(ctxpp, x, y, x, endY);
            //legs
            handDrawLine(ctxpp, x, endY, x-1, endY+1);
            handDrawLine(ctxpp, x, endY, x+1, endY+1);
            //arms
            //handDrawLine(ctxpp, x-maxlegPosX, y+rad+5, x+maxlegPosX, y+rad+5);
            //arms
            let bodyLen = endY - (y+rad);
            let elbY = y+rad+bodyLen/3;
            handDrawLine(ctxpp, x, y+rad, x + maxlegPosX*2/3, elbY );
            handDrawLine(ctxpp, x+maxlegPosX*2/3, elbY, x,  y+rad+bodyLen- 3);

            ctxpp.stroke();
            if((plAbsMoveInc > 0 && y >= moveEndY) || (plAbsMoveInc < 0 && y <= moveEndY)){
                clearInterval(moveInterval);
                moveInProgress = -1;
                drawPlayerCoords(rpp, cpp);
            }
        }
        function movePlayerUD(er){
            oldrpp = rpp; rpp = er;
            moveEndY = y0 + er * hCellpx + hCellpx / 3;
            plAbsMove = 0; 
            plAbsMoveInc = (oldrpp > rpp)? -5 : 5;
            moveInProgress = (oldrpp > rpp)? 3 : 4;
            moveInterval = setInterval(function(){
                drawPlayerMoveUpDown();
            }, 50);   
        }

        function endMoveInProgress(){
            clearInterval(moveInterval);
            if(moveInProgress > 0) drawPlayerCoords(rpp, cpp);
        }

    };


    /********************************************************************
    **
    **  FACE
    **
    ********************************************************************/
    function Face(ctx, clr){
                let wC = 30, hC = 30; 
                let center = [wC/2, hC/2];

                let myctx = ctx;
                let myclr = clr;
                this.drawFace = drawFace;
                this.blink = blink;
                this.blinkTwice = blinkTwice;
                this.smileShake = smileShake;
                this.canvas = function(){
                    return myctx.canvas;
                    //someCtx.drawImage(faces[i].canvas, 0, 0);
                }
                this.setCanvas = function(ctx){
                    myctx = ctx;
                }
                function drawFace(face, gRnd, blinkPos){ 
                    myctx.clearRect(0,0,wC,hC);
                    myctx.beginPath();
                    //head-circle
                    handDrawCircle(myctx, center[0], center[1], wC/2 -2);
                    myctx.arc(center[0], center[1], wC/2 -3, 0, 2 * Math.PI, false);
                    myctx.fillStyle = myclr;
                    myctx.fill();
                    //nose
                    handDrawCircle(myctx, center[0], center[1], 1);
                    myctx.stroke();
                    //eyes
                    if(!gRnd){
                        gRnd = [];
                        for(var i=0;i<=3;i++) gRnd[i] = rn(5, -2);
                        myctx.beginPath();
                        handDrawCircle(myctx, wC/4+gRnd[0], hC/4+2+gRnd[1], 6);
                        handDrawCircle(myctx, 3*wC/4+gRnd[2], hC/4+2+gRnd[3], 6);
                        myctx.stroke();
                        myctx.beginPath();
                        myctx.arc(wC/4+gRnd[0], hC/4+2+gRnd[1], 5, 0, 2 * Math.PI, false);
                        myctx.fillStyle = 'white';
                        myctx.fill();
                        myctx.stroke();
                        myctx.beginPath();
                        myctx.arc(3*wC/4+gRnd[2], hC/4+2+gRnd[3], 5, 0, 2 * Math.PI, false);
                        myctx.fill();
                        myctx.stroke();
                    }else{
                        myctx.beginPath();
                        myctx.arc(wC/4+gRnd[0], hC/4+2+gRnd[1], 5, 0, Math.PI);
                        myctx.quadraticCurveTo(wC/4, hC/4-8 + blinkPos, wC/4+5+gRnd[0], hC/4+2+gRnd[1])
                        myctx.fillStyle = 'white';
                        myctx.fill();
                        myctx.stroke();
                        
                        myctx.beginPath();
                        myctx.arc(3*wC/4+gRnd[2], hC/4+2+gRnd[3], 5, 0, Math.PI);
                        myctx.quadraticCurveTo(3*wC/4, hC/4-8 + blinkPos, 3*wC/4+5+gRnd[2], hC/4+2+gRnd[3])
                        myctx.fill();
                        myctx.stroke();
                    }
                    

                    myctx.beginPath();
                    if(face===0) normal();
                    if(face===1) happy();
                    if(face===2) angry();
                    if(face===3) surprise();
                    if(face===4) what();
                    myctx.stroke();
                };

                function normal(){             
                    myctx.beginPath();
                    myctx.moveTo(wC/4, hC*3/4-1);
                    myctx.bezierCurveTo(wC/4,hC*3/4+1, (3*wC)/4,hC*3/4+1, (3*wC)/4,hC*3/4);
                    myctx.stroke();
                }
                function happy(){             
                    myctx.beginPath();
                    myctx.moveTo(wC/4, hC/2+4);
                    myctx.bezierCurveTo(wC/4,hC-5, (3*wC)/4, hC-5, (3*wC)/4,hC/2+4);
                    myctx.quadraticCurveTo(wC/2-3, hC*3/4, wC/4, hC/2+4)
                    myctx.fill();
                    myctx.stroke();
                }
                function angry(){              
                    myctx.beginPath();
                    myctx.moveTo(wC/4, hC*3/4+3);
                    myctx.quadraticCurveTo(wC/2-3, hC/2+4, 3*wC/4, hC*3/4+3)
                    myctx.quadraticCurveTo(wC/2-3, hC*3/4-3, wC/4, hC*3/4+3)
                    myctx.stroke();
                }
                function what(){
                    handDrawLine(myctx, wC/4, hC*3/4, 3*wC/4, hC*3/4)
                }
                function surprise(){
                    handDrawCircle(myctx, wC/2, hC*3/4, 3);
                    myctx.arc(wC/2, hC*3/4, 3, 0, 2 * Math.PI, false);
                    myctx.fill();
                }

                function blink(face){
                    let gRnd = [];
                    for(var i=0;i<=3;i++) gRnd[i] = rn(5,-2);
                    let blinkPos = 1, blinkMove = 7, blinkR = 0;;
                    let blinkInterval = setInterval(()=>{
                        blinkPos += blinkMove;
                        if(blinkPos >= 20)
                            blinkMove = -blinkMove;
                        if(blinkPos <= 2){
                            clearInterval(blinkInterval);
                            gRnd = undefined;
                            blinkPos = 2;
                        }
                        drawFace(face, gRnd, blinkPos);
                    }, 50);
                }

                function smileShake(face){
                    let smileInterval = setInterval(()=>{
                        myctx.save();
                        myctx.translate(0, rn(6,-3));  
                        drawFace(face);
                        myctx.restore();
                    }, 100);
                    setTimeout(()=>{
                        clearInterval(smileInterval);
                        drawFace(face);
                    }, 2500);
                }

                function blinkTwice(face){
                    blink(face);
                    setTimeout(()=> blink(face), 700);
                }
    }





    /********************************************************************
    **
    **  Conversations
    **
    ********************************************************************/
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; 
        }
    }
    function initConversation(){
        for(let n in convs){
            convs[n].counter = 0;
            shuffleArray(convs[n]);
        }

        //setConv('smallTalk2');
        setConv('helloConv');
    }
    
    function setConv(name, plNoEl){
        if(convInProgress == true) return;
        let cnt = convs[name].counter;
        if((++convs[name].counter) >= convs[name].length){ 
            convs[name].counter = 0;
            if(name === 'smallTalk'){// no new conversations
                name = 'outOfMemory'; cnt = 0;
            }
        }
        let txt = '';
        if(Array.isArray(convs[name][cnt])){
            convInProgress = true; let lastTime = -2000;
            for(let i=0; i<convs[name][cnt].length; i++){
                [txt, face, plNo, time, nextConv, anim] = getLineConv( convs[name][cnt][i] );
                if(!plNo){ plNo = (i%4==0)? 1:(i%4==3)? 2:i%4+2; }
                if(!face) face = 0;
                time = (!time)? lastTime + 2000 : lastTime + time*1000;
                lastTime = time;
                //addLineConv(plNo, txt, faceType, time, anim, animFaceType, animTime)
                if(name == 'meElectr' || name == 'enemyElectr') plNo = plNoEl;
                addLineConv(plNo, txt, face, time, anim, 3); 
            }
            setTimeout(()=>{ 
                convInProgress = false; 
                if(name === 'rulesMakeFun') 
                    setTimeout(()=>setConv('rules'), 4000);
                else if(name === 'rules') 
                    setTimeout(()=>setConv('tactics'), 20000);
                else if(name === 'outOfMemory') 
                    setTimeout(()=>setConv('wakeUp'), 120000);
                else if(name === 'wakeUp') 
                    setTimeout(()=>setConv('rules'), 10000);
                else
                    setTimeout(()=>setConv('smallTalk'), 60000);
            }, time);
        }else{
            console.log(name+' is not conversation.');
        }
    }
    this.getLineConv = getLineConv;
    function getLineConv(str){
        let ind = str.indexOf('-');
        let txt = '', face, plNo, time, nextConv, anim;
        while(ind >= 0){
            txt += str.substr(0,ind);
            str = str.substr(ind);
            let c = str.substr(1, 1), t, k;
            if(c == 'q'){
                [t,k] = txtTillNextSpace(str.substr(2));
                if(!k) k = rn(convs[t].length);
                [txt1] = getLineConv(convs[t][k]);
                txt += txt1;
            }
            if(c == 'r'){
                [t,k] = txtTillNextSpace(str.substr(2));
                if(!k) k = rn(6,2);
                for(let i=0;i<k;i++) 
                    txt += t;
            }
            if(c == 'c'){
                [nextConv] = txtTillNextSpace(str.substr(2));
            }
            if(c == 't'){
                time = parseFloat(str.substring(2, (str.indexOf(' ') >= 0)? str.indexOf(' ') : str.length));
            }
            if(c == 'p'){
                plNo = parseInt(str.substr(2, 1));
            }
            if(c == 'f'){
                face = parseInt(str.substr(2, 1));
            }
            if(c == 'a'){
                [anim] = txtTillNextSpace(str.substr(2));
            }
            //cut str by the part that was processed
            let ns = str.indexOf(' ');
            str = (ns >= 0)? str.substr(ns) : '';
            ind = str.indexOf('-');
        }
        txt += str;
        return [txt, face, plNo, time, nextConv, anim];
    }
    function txtTillNextSpace(str){
        let t = str.substring(0, (str.indexOf(' ') >= 0)? str.indexOf(' ') : str.length);
        let k;
        if(t.substr(0,1) >= '0' && t.substr(0,1) <= '9'){
            k = parseInt(t.substr(0,1));
            t = t.substr(1); 
        }
        return [t,k];
    }
    function addLineConv(plNo, txt, faceType, time, anim, animFaceType){
        setTimeout(()=> {
            let div = document.createElement('div');
            let div1 = document.createElement('div');
            let div2 = document.createElement('div');
            let canvas = document.createElement('canvas');
            canvas.id = "face"+(++convId);
            canvas.width = 30;
            canvas.height = 30;
            let divIn = (plNo < 3)? div1 : div2;
            let divOut = (plNo < 3)? div2 : div1;
            divOut.innerHTML = ' ';
            divIn.appendChild(canvas);
            if(txt!=''){
                let span = document.createElement('span');
                span.append(txt);
                divIn.appendChild(span);
            }
            div.appendChild(div1);
            div.appendChild(div2);
            convsDiv.appendChild(div);
            convsDiv.scrollTop = convsDiv.scrollHeight;
            var ctx = gc(canvas);
            let face = new Face(ctx, plColors[plNo]);
            face.drawFace(faceType);
            if(anim && animFaceType)
                setTimeout( ()=>face[anim](animFaceType), 300);
        }, time);
    }

    function loadInstructions(){
        let conv = convs['rules'][0];
        let str = '';
        for(let i=0; i<conv.length-1; i++){
            [txt] = getLineConv(conv[i]);
            str += txt+'<br /><br />';
        }
        $("#instructions").innerHTML = str;
    }




    /********************************************************************
    **
    **  CPU PLAY
    **
    ********************************************************************/

        /*const grades = {
        -10 kill stronger
        -9 kill weaker
        -8 complete all coins
        -5+2 coin+wound stronger
        -5+1 coin+wound weaker
        -5 - coin
        -3 wound stronger enemy
        -2 wound weaker enemy
        -1 follow coin path 
        }


        bUGS:
        1 mrtav path is und
        2.nije odigrao dva poteza
        */
    function cpuPlay(){
        if(diceNo > 0){
            drawMarkedPlayer();
            let plNo = army[cpuArmy][markedPlayer];
            if(players[plNo].isDead()) endMove();
            let hh = getAllPathsForPlayer(plNo, 1);
            let sPath = bestPathForPl(hh, 1);
            cpuPlayPath(sPath.myPath);
        }else{
            let bothPaths = [];
            let pl = [army[cpuArmy][0], army[cpuArmy][1]];
            for(let i=pl[0]; i<=pl[1]; i++){
                //gather all paths to get coin or electr.enemy
                if(!players[i].isDead())
                    bothPaths[i] = getAllPathsForPlayer(i);
            }
            //pick the one path to play
            findTheBestCpuPaths(bothPaths);
        }
    }
    function plNoWithHigherCoin(armyNo){
        let pl = [army[armyNo][0], army[armyNo][1]], plHC = [];
        for(let i=0;i<2;i++){
            if(players[pl[i]].isDead()) return pl[1-i];
            plHC[i] = prevCoin[pl[i]].charCodeAt(0) - firstCoin[pl[i]].charCodeAt(0);
        }
        //get army player with higher coin or the one that is farther from his last coin
        return  (plHC[0]-plHC[1] > 0)? pl[0] : 
                (plHC[0]-plHC[1] < 0)? pl[1] : 
                (players[pl[0]] > players[pl[1]])? pl[0] : pl[1];  
    }

    function getAllPathsForPlayer(plNo, ldiceNo, diceR){
        let paths = [];
        [r1,c1] = players[plNo].getCoords();
        let pleHC = plNoWithHigherCoin(1-cpuArmy);
        let b=0,e=2; if(ldiceNo){ b=ldiceNo; e=ldiceNo+1;}
        if(players[plNo].canKill === false){
            [goalR,goalC] = mapLegend[nextCoin[plNo]]; //coords of nextItem
            let coinFullPath = findCpuCoinPath(plNo,goalR,goalC);
            let cfpl = coinFullPath.length;
            for(let dn=b;dn<e;dn++){
                let dice = (diceR)? diceR : diceNumbers[dn];
                paths.push({plNo: -1, diceNo:dn, myPath: coinFullPath.substr(0,dice), grade:1 });
                let l = paths.length-1, r = dice - cfpl;
                if(r > 0){
                    //can still move after coin, check can he kill anybody
                    let nPaths = testPathFromCoords(plNo,goalR,goalC,dn,r);
                    //join path to the coin with the path after coin!
                    let mp = paths[l].myPath;
                    paths.pop();
                    for(let i=0;i<nPaths.length;i++){
                        paths.push({ 
                            plNo:nPaths[i].plNo, diceNo:dn, myPath:mp + nPaths[i].myPath,
                            grade: (nPaths[i].plNo<0)? 5 : (pleHC == nPaths[i].plNo)? 7 : 6
                        });
                        if(nextCoin[plNo] == lastCoin[plNo])
                            paths[paths.length-1].grade += 3; //become a killer, and grades are higher
                    }
                }else{
                    //we stand right on the coin
                    if(dice == cfpl)
                        paths[l].grade =  (nextCoin[plNo] == lastCoin[plNo])? 8 : 5;
                    else{
                        //can we change last 1 or 2 moves and at least wound enemy?
                        let nPaths = joinElCoinPath(plNo, paths[l]);
                        for(let i=0;i<nPaths.length;i++)
                            paths.push({ 
                                plNo:nPaths[i].plNo, diceNo:dn, myPath: nPaths[i].myPath,
                                grade: (pleHC == nPaths[i].plNo)? 3 : 2
                            });
                    }
                }
            }
        }else{
            for(let dn=b;dn<e;dn++){
                let dice = (diceR)? diceR : diceNumbers[dn];
                allAvPaths = [];
                allAvailablePaths('',r1,c1, dice,true); //true for: find only path to electr.enemy
                for(let j=0;j<allAvPaths.length;j++)
                    allAvPaths[j].diceNo = dn;
                paths = paths.concat(allAvPaths); 
                for(let i=0;i<paths.length;i++)
                    paths[i].grade = (pleHC == paths[i].plNo)? 10 : 9;
            }
            if(paths.length == 0){
                //with more memory this could be much better
                [goalR,goalC] = players[pleHC].getCoords(); //coords of pl with higher coin
                let enemyFullPath = findCpuCoinPath(plNo,goalR,goalC);
                for(let dn=b;dn<e;dn++)
                    paths.push({plNo: -1, diceNo:dn, 
                        myPath: enemyFullPath.substr(0,dice), grade: 1
                    });
            }
        }
        return paths;
    }

    function findCpuCoinPath(plNo,goalR,goalC){
        [r1,c1] = players[plNo].getCoords(); //coords of current player
        succPath = '';
        bestPathToCoords('',r1,c1,[],goalR,goalC);
        return succPath;
    }
    function bestPathToCoords(thisPath,r1,c1,beenThere,goalR,goalC){
        let maybePath = '';
        let arr=['U','R','L','D'];
        for(let i=0;i<4;i++)
            if(mapAvailableMoves[r1][c1].indexOf(arr[i])>=0) maybePath+=arr[i]; 
        for(let i=0;i<maybePath.length;i++){
            let dir=maybePath.substr(i,1);
            let rn=r1, cn=c1; 
            if(dir=='U') rn--; if(dir=='D') rn++;
            if(dir=='L') cn--; if(dir=='R') cn++;
            if(!beenThere[rn*100+cn]){
                beenThere[rn*100+cn] = true;
                let newPath = thisPath + dir; 
                if(rn==goalR && cn == goalC){
                    if(succPath=='' || succPath.length > newPath.length) 
                        succPath = newPath;
                }else
                    bestPathToCoords(newPath,rn,cn,beenThere,goalR,goalC);
                beenThere[rn*100+cn] = false;
            }
        }
    }
    function joinElCoinPath(plNo, coinPath){
        [r1,c1] = players[plNo].getCoords();              
        //its always the best to chase a coin. but if enemy is on the near path why not el.him.
        //only if he is 5 fields from his last coin, 
        //and 1 or 2 moves away from my coin path
        let len = coinPath.myPath.length;
        allAvPaths = [];
        allAvailablePaths('',r1,c1, len,true);
        let nPaths = [];
        let last = (len>1)? rn(2,1) : 1, minDistance = 5;
        for(let k=0;k<allAvPaths.length;k++)
            if(coinPath.myPath.substr(0,len-last) == allAvPaths[k].myPath.substr(0,len-last)
            && players[allAvPaths[k].plNo].distance > minDistance)  
                nPaths.push(allAvPaths[k]);
        return nPaths;
    }

    function bestPathForPl(paths, ldiceNo, lplNo){
        let max=paths[0].grade, ind=0;
        for(let i=1;i<paths.length;i++)
            if((max<paths[i].grade || 
            (max==paths[i].grade && paths[ind].myPath.length>paths[i].myPath.length)) && 
            (ldiceNo !== undefined || paths[i].diceNo==ldiceNo) && 
            (lplNo != undefined || paths[i].plNo==lplNo)) { 
                max=paths[i].grade; ind=i; 
            }
        return paths[ind];
    }

    function findTheBestCpuPaths(bothPaths){
        let pl = [army[cpuArmy][0], army[cpuArmy][1]];
        let bestPathsForDice0 = [];
        markedPlayer = -1;
        for(let i=0;i<2;i++)
            if(!players[pl[i]].isDead())
                bestPathsForDice0[i] = bestPathForPl(bothPaths[pl[i]], 0);                
            else
                markedPlayer = 1-i;
        if(markedPlayer < 0) 
        if(bestPathsForDice0[0].grade == bestPathsForDice0[1].grade && 
        (bestPathsForDice0[0].grade == 10 || bestPathsForDice0[0].grade == 7 || bestPathsForDice0[0].grade == 3))
            //who's better for the second dice, he plays second
            markedPlayer = (bestPathForPl(bothPaths[pl[0]], 1).grade > bestPathForPl(bothPaths[pl[1]], 1).grade)?  
                1 : 0;
        else
            markedPlayer = (bestPathsForDice0[0].grade > bestPathsForDice0[1].grade)?  0 : 1;
        //finally
        drawMarkedPlayer();
        changeNextGameMove();
        cpuPlayPath(bestPathsForDice0[markedPlayer].myPath);
    }

    function cpuPlayPath(path){ 
        for(let i=0;i<diceNumbers[diceNo];i++){
            let c=path.substr(i,1);
            allTOplays[i] = setTimeout(()=>movePlayer(c), 1000*i);
        }
    };

    function testPathFromCoords(plNo,fromR,fromC,ldiceNo,dice){
        //remember old data
        let old1 = players[plNo].canKill, old2 = nextCoin[plNo],
            [oldr1,oldc1] = players[plNo].getCoords();
        //set new data for after coin picked
        if(nextCoin[plNo] === lastCoin[plNo])
            players[plNo].canKill = true;
        else
            nextCoin[plNo] = String.fromCharCode(nextCoin[plNo].charCodeAt(0)+1);
        players[plNo].setCoords(fromR,fromC);
        //get new paths for wound
        /*allAvPaths = [];
        allAvailablePaths('',fromR,fromC,dice,true);
        //get path for next coin
        [goalR,goalC] = mapLegend[nextCoin[plNo]]; //coords of nextItem
        let nc = findCpuCoinPath(plNo,goalR,goalC);
        allAvPaths.push({plNo: -1, myPath: nc.substr(0,dice) });*/
        let nPaths = getAllPathsForPlayer(plNo,ldiceNo,dice);
        //set old data
        players[plNo].canKill = old1;
        nextCoin[plNo] = old2;
        players[plNo].setCoords(oldr1,oldc1);
        return nPaths;
    }

    function allAvailablePaths(thisPath,r1,c1,dice, checkEl){
        let maybePath = '';
        let arr=['U','R','L','D'];
        for(let i=0;i<4;i++)
            if(mapAvailableMoves[r1][c1].indexOf(arr[i])>=0) maybePath+=arr[i]; 
        for(let i=0;i<maybePath.length;i++){
            let dir=maybePath.substr(i,1);
            let newPath = thisPath + dir; 
            let rn=r1, cn=c1; 
            if(dir=='U') rn--; if(dir=='D') rn++;
            if(dir=='L') cn--; if(dir=='R') cn++;
            let newDice = dice-1;
            if(newDice == 0){
                if(checkEl === true){
                    if(checkElectrify([rn, cn], false)) //false for dont electrify for real, just check
                        allAvPaths.push({plNo:elecPls[0], myPath:newPath} );
                }else
                    allAvPaths.push(newPath);
            }else{
                allAvailablePaths(newPath,rn,cn,newDice,checkEl);
            }
        }
    }







    /********************************************************************
    **
    **  CREATE RANDOM MAP
    **
    ********************************************************************/

    function measureDistForAllPlayers(){
        for(let plNo=1;plNo<5;plNo++){
            var c = firstCoin[plNo];
            [r1,c1] = players[plNo].getCoords();
            let len = [], len1 =0;
            for(let i=1;i<4;i++){
                [goalR,goalC] = mapLegend[c];  
                len.push(shortestDist(r1,c1,goalR,goalC));
                len1 += succPath.length;
                c = String.fromCharCode(c.charCodeAt(0)+1);
                [r1,c1] = [goalR,goalC];
            }
            console.log('PL ',plNo,' = '+len+' = ',len1 );
        }
    }
    function shortestDist(r1,c1,goalR,goalC){
        succPath = '';
        bestPathToCoords('',r1,c1,[],goalR,goalC);
        return succPath.length;
    }

    function createRndCoinsMap(){
        //reset map
        mapLegend = {};
        for(let i=0;i<mapSizeR; i++){
            mapCoins[i] = [];
            for(let j=0; j<mapSizeC; j++) mapCoins[i][j] = '';
        }

        prevCoin = [, 'W', 'X', 'Y', 'Z'];
        for(let i=1;i<=4;i++)
        mapCoins[0][0] = "W";mapCoins[mapSizeR-1][0] = "X";
        mapCoins[0][mapSizeC-1] = "Y";mapCoins[mapSizeR-1][mapSizeC-1] = "Z";
        mapLegend['W'] = [0,0];mapLegend['X'] = [mapSizeR-1,0];
        mapLegend['Y'] = [0,mapSizeC-1];mapLegend['Z'] = [mapSizeR-1,mapSizeC-1];

        let c=[], coords = [,[],[],[],[]], fc = [,[],[],[],[]], fail = 0; 
        for(let coinInd=0;coinInd<3;coinInd++){
            let plArr = [1,2,3,4]; 
            shuffleArray(plArr);
            for(let i=0;i<4;i++){
                let plNo=plArr[i];
                [r1,c1] = (coinInd==0)? mapLegend[prevCoin[plNo]] : mapLegend[c[plNo]];
                c[plNo] = (coinInd==0)? firstCoin[plNo] : String.fromCharCode(c[plNo].charCodeAt(0)+1);
                let bool=true;
                coords[plNo] = [];
                for(let rM=0;rM<mapSizeR;rM++)
                    for(let cM=0;cM<mapSizeC;cM++)
                        if(mapCoins[rM][cM] == ''){
                            let dist = shortestDist(r1,c1,rM,cM);
                            if(dist>=11 && dist <= 13)
                                coords[plNo].push([rM,cM]);
                        }                
            }
            let failed= false;
            for(let i=0;i<4;i++){
                let plNo=plArr[i];
                if(coords[plNo].length == 0){
                    fail++; failed = true;
                    coinInd--; //try again
                    if(fail > 5) return false; //for endless loop. try max 5 times
                }
            }
            if(!failed){
                let writeCoords = [];
                for(let i=0;i<4;i++){
                    let plNo=plArr[i];
                    failed = true;
                    shuffleArray(coords[plNo]); 
                    for(let j=0;j<coords[plNo].length;j++){
                        [rM,cM] = coords[plNo][j];
                        if(mapCoins[rM][cM] == '' && writeCoords.indexOf(rM*100+cM) < 0){
                            fc[plNo].push(coords[plNo][j]);
                            j=coords[plNo].length;
                            failed=false;
                            writeCoords[plNo] = rM*100+cM;
                        }
                    }
                    if(failed){
                        console.log('FAILED');
                        fail++; 
                        coinInd--; //try again
                        i=4;
                        if(fail > 5) return false;
                    }
                }
                if(!failed){
                    for(let plNo=1;plNo<5;plNo++){
                        let cM = writeCoords[plNo] % 100;
                        let rM = parseInt(writeCoords[plNo] / 100);
                        mapCoins[rM][cM] = c[plNo];
                        mapLegend[c[plNo]] = [rM,cM];
                    }
                }
            }
        }
        return true;
    }

    function drawRndMap(){
        for(let i=0;i<mapSizeR; i++)
            for(let j=0; j<mapSizeC; j++)
                if(mapCoins[i][j] !== ''){
                    let c = prevCoin.indexOf(mapCoins[i][j]);
                    let clr = getLetterClrPart(mapCoins[i][j]);
                    if(c<0)
                        writeLetter(mapCoins[i][j], clr, i, j, true);
                    else
                        writeStart(plColors[c], i, j, true);
                }
    }
};