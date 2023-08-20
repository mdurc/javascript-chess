const board = document.querySelector(".board");
const flipBoardButton = document.querySelector(".flip");
const computerButton = document.querySelector(".computer");
const toggleHints = document.querySelector(".toggleHints");
const statusText = document.querySelector(".status");
const moveHistory = document.querySelector(".moveHistory");
const getPGNButton = document.querySelector(".getPGN");

moveHistory.setAttribute('style', 'white-space: pre;');

let attemptedPieces = new Set();

let turn = document.querySelector(".turn");
let isBlank = false;

let confirmedCheckmate = false;
let result = null;

let hintTransparency = 0.2;

let draggedPiece = null;
let isDragging = false;

let lastPressedPiece = null;
let lastMove = null;
let lastMoveOldSquare = null;
let lastMoveToSquare = null;
let lastMoveText = null;
let newMove = null;

let kingElementInCheck = null;
let checkAttackingPiece = null;

const attackedSquares = {
	white: [], 
	black: [],
};

boardSetup(); //creates piece elements
printBoardCoords();
let pieces = document.querySelectorAll(".piece.white"); //white goes first


updateAttackedSquares();


computerButton.addEventListener('click', () => {
	attemptedPieces = new Set();
	computerMove();
});


function computerMove() {
	const computerPieces = document.querySelectorAll(`.piece.${turn.textContent.toLowerCase()}`);
	const availablePieces = Array.from(computerPieces).filter(piece => !attemptedPieces.has(piece));

	if (availablePieces.length === 0) {
		console.log("No pieces available to move");
        return;
    }
	const randomPieceIndex = Math.floor(Math.random() * availablePieces.length);
	const randomPiece = availablePieces[randomPieceIndex];

	const mousedownEvent = new MouseEvent('mousedown', {
		bubbles: true,
		cancelable: false,
		view: window
	});
	randomPiece.dispatchEvent(mousedownEvent);

	const hintComputerOptions = document.querySelectorAll('.hint');
	if (hintComputerOptions.length === 0) {
		attemptedPieces.add(randomPiece);
		document.dispatchEvent(new MouseEvent('mouseup'));
        computerMove();
    }else{
		document.dispatchEvent(new MouseEvent('mouseup'));
		const randomMoveIndex = Math.floor(Math.random() * hintComputerOptions.length);
		const randomMove = hintComputerOptions[randomMoveIndex];

		const movePieceEvent = new MouseEvent('mousedown', {
			bubbles: true,
			cancelable: true,
			view: window
		});

		randomMove.dispatchEvent(movePieceEvent);
		document.dispatchEvent(new MouseEvent('mouseup'));
		
		attemptedPieces.clear();
	}
}

toggleHints.addEventListener('click', (event)=>{
	if(hintTransparency === 0.2){
		hintTransparency = 0;
	}else{
		hintTransparency = 0.2;
	}
});
getPGNButton.addEventListener('click', (event)=>{
	const history=  convertToPGN(moveHistory.textContent);

	const tempTextArea = document.createElement('textarea');
	tempTextArea.value = history;

    document.body.appendChild(tempTextArea);

	tempTextArea.select();
    tempTextArea.setSelectionRange(0, 99999); //For mobile

    document.execCommand('copy');

    document.body.removeChild(tempTextArea);

    getPGNButton.textContent = 'Copied';

	setTimeout(() => {
		getPGNButton.textContent = 'Get PGN';
    }, 1000);
});

flipBoardButton.addEventListener('click', flipBoard);

function convertToPGN(inputText) {
    let pgn = `[Event "?"]\n[Site "?"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result ${result}]\n\n`;
    let moveNumber = 1;
	let displayNumber = 1;
    let moves = '';
    const lines = inputText.trim().split('\n');

    for (const line of lines) {
        const parts = line.split(/\s+/);
		if(parts.length==1){
			parts.push(" ");
		}
        const moveText = parts.slice(0, -1).join(' ');
        const result = parts[parts.length - 1];

        if (moveNumber % 2 === 1) {
            moves += `${displayNumber}. ${moveText} `;
        } else {
            moves += `${moveText} ${result}`;
			displayNumber++;
        }

        moveNumber++;
    }

    pgn += moves;
    return pgn;
}

function updateMoveHistory(capture, castled, castleDirection, pieceLetter, isPromotion){
	let isPawn = false;
	if(pieceLetter == null){
		isPawn = true;
	}
	if(castled){
		if(castleDirection == null){ //moving the king. When the rooks swap they add to the history

		}else if(castleDirection == "short"){
			moveHistory.textContent += "O-O";
			if(confirmedCheckmate){
				moveHistory.textContent +="#\r\n";
			}else if(kingElementInCheck){
				moveHistory.textContent +="+\r\n";
			}else{
				moveHistory.textContent +="\r\n";
			}
		}else{
			moveHistory.textContent += "O-O-O";
			if(confirmedCheckmate){
				moveHistory.textContent +="#\r\n";
			}else if(kingElementInCheck){
				moveHistory.textContent +="+\r\n";
			}else{
				moveHistory.textContent +="\r\n";
			}
		}
	}else{
		if(pieceLetter && !isPromotion){
			moveHistory.textContent += pieceLetter;
		}

		let nextMove = lastMoveText.substring(1);
		if (/^[1-8]$/.test(lastMoveText[0])) {
			lastMoveText = String.fromCharCode(96 + parseInt(lastMoveText[0])) + nextMove;
		}

		
		if(capture){
			if(isPawn){
				lastMoveText = lastMoveText.substring(0,1) + "x";
			}else if(isPromotion){
				lastMoveText = lastMoveText.substring(0,1) + "x";
			}else{
				lastMoveText ="x"; 
			}
		}else{

			if(isPawn){
				lastMoveText = "";
			}else{
				lastMoveText += ""; 
			}
		}
		
		nextMove = newMove.substring(1);
		if (/^[1-8]$/.test(newMove[0])) {
			newMove = String.fromCharCode(96 + parseInt(newMove[0])) + nextMove;
		}

		lastMoveText += newMove;
		moveHistory.textContent += lastMoveText;
		if(isPromotion){
			moveHistory.textContent += `=${pieceLetter}`;
		}
		if(confirmedCheckmate){
			moveHistory.textContent +="#\r\n";
			
			moveHistory.textContent+= result;
		}else if(kingElementInCheck){
			moveHistory.textContent +="+\r\n";
		}else{
			moveHistory.textContent +="\r\n";
		}
	}
}

function swapNodes(lastPressedPiece, emptySquare, castled = false, castleDirection = null, pieceLetter = null, isPromotion = false){	
	let capture = false;
	if(emptySquare.classList.contains("piece")){
		capture = true;
	}
	let color = (getPieceColor(lastPressedPiece) === "white") ? "black" : "white";
	lastMove = lastPressedPiece;
	lastMoveOldSquare = lastPressedPiece.parentNode;
	lastMoveToSquare = emptySquare.parentNode;
	lastMoveText = lastPressedPiece.parentNode.getAttribute("column")+lastPressedPiece.parentNode.getAttribute("row");
	newMove = emptySquare.parentNode.getAttribute("column")+emptySquare.parentNode.getAttribute("row");
	

	if(emptySquare.classList.contains("passant")){
		let capturedPawnSquare = document.querySelector(`[row="${parseInt(lastPressedPiece.parentNode.getAttribute("row"))}"][column="${parseInt(emptySquare.parentNode.getAttribute("column"))}"]`);
		capturedPawnSquare.firstChild.remove();
		capturedPawnSquare.appendChild(newEmpty());
		capture = true;
	}

	lastPressedPiece.parentNode.appendChild(newEmpty());
	emptySquare.parentNode.appendChild(lastPressedPiece);  
	removeHints();
	emptySquare.remove();
	updateAttackedSquares();

	isKingChecked();	
	
	if(document.querySelectorAll(`.piece.${color}`).length==1){
		if(checkStalemate(color, document.querySelector(`.${color}.king`))){
			if(!kingElementInCheck){
				statusText.textContent="Stalemate.";
				result = "1/2-1/2";
			}
		}
	}

	updateMoveHistory(capture, castled, castleDirection, pieceLetter, isPromotion);
}
function checkStalemate(color, lastPieceKing) {
	let locX = parseInt(lastPieceKing.parentNode.getAttribute("column"));
    let locY = parseInt(lastPieceKing.parentNode.getAttribute("row"));
	let oppColor = (color === "white") ? "black" : "white";
	let returnVal = true;
	const potentialHintSquares = [
			document.querySelector(`[row="${locY+1}"][column="${locX}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX-1}"]`),
		];

	potentialHintSquares.forEach(square => {
		if (square) {
			if(!isSquareAttackedByColor(parseInt(square.getAttribute("row")), parseInt(square.getAttribute("column")), oppColor)){
				returnVal = false;
			}
		}
	});
	return returnVal;
}

function handlePromotion(pawnElement, isComputer){
	let pawnSquare = pawnElement.parentNode;
	const promotionOptions = ['Queen', 'Rook', 'Knight', 'Bishop'];
	let colorLetter = (getPieceColor(pawnElement)==="white") ? "w" : "b";
	let promotionChoice;
	let newPiece = null;

	if(isComputer){ //defaultly give queen
		pawnElement.remove();
		newPiece = pieceSetup(null, null, null, `${colorLetter}q`);
		pawnSquare.appendChild(newPiece);
		return newPiece;
	}

	while (true) {
		promotionChoice = prompt('Select a piece for pawn promotion:\n' + promotionOptions.join(', '));

		if (promotionOptions.includes(promotionChoice)) {
			break; // Valid choice, exit the loop
		} else {
			console.log('Invalid choice. Please select one of: ' + promotionOptions.join(', '));
		}
	}
	

	switch (promotionChoice) {
		case "Queen":
			pawnElement.remove();
			newPiece = pieceSetup(null, null, null, `${colorLetter}q`);
			pawnSquare.appendChild(newPiece);
			return newPiece;
		case "Rook":
			pawnElement.remove();
			newPiece = pieceSetup(null, null, null, `${colorLetter}r`);
			pawnSquare.appendChild(newPiece);
			return newPiece;
		case "Knight":
			pawnElement.remove();
			newPiece = pieceSetup(null, null, null, `${colorLetter}n`);
			pawnSquare.appendChild(newPiece);
			return newPiece;
		case "Bishop":
			pawnElement.remove();
			newPiece = pieceSetup(null, null, null, `${colorLetter}b`);
			pawnSquare.appendChild(newPiece);
			return newPiece;

		default:
			break;
	}	
}

function movePiecePosition(lastPressedPiece, square, isComputer = false){//lastPressedPiece is the actual piece element. Square is the empty div element
	//Pawn Promotion!
	if(lastPressedPiece.classList.contains("wp") && parseInt(square.parentNode.getAttribute("row"))== 8){

		let newPromotedPiece = handlePromotion(lastPressedPiece, isComputer);
		swapNodes(newPromotedPiece,square, false, null, newPromotedPiece.getAttribute("pieceLetter"), true);

	}else if(lastPressedPiece.classList.contains("bp") && parseInt(square.parentNode.getAttribute("row"))== 1){

		let newPromotedPiece = handlePromotion(lastPressedPiece, isComputer);
		swapNodes(newPromotedPiece,square, false, null, newPromotedPiece.getAttribute("pieceLetter"), true);

	}else if(lastPressedPiece.classList.contains("wr") && lastPressedPiece.getAttribute("data-moved")=="false" || lastPressedPiece.classList.contains("br") && lastPressedPiece.getAttribute("data-moved")=="false"){
		lastPressedPiece.setAttribute("data-moved", "true");

		swapNodes(lastPressedPiece, square, false, null, lastPressedPiece.getAttribute("pieceLetter"));
		
	}else if(lastPressedPiece.classList.contains("wk") && lastPressedPiece.getAttribute("data-moved")=="false"|| lastPressedPiece.classList.contains("bk") && lastPressedPiece.getAttribute("data-moved")=="false"){
		let castled = false;
		lastPressedPiece.setAttribute("data-moved", "true");
		//take care of moving the rook over in castling
		//kingStartingSquareColumn = 5;
		if(7 == parseInt(square.parentNode.getAttribute("column"))){//short castled because moved two columns to the right
			const rookNewSquare = document.querySelector(`[row="${parseInt(lastPressedPiece.parentNode.getAttribute("row"))}"][column="${6}"]`);
			const rook = document.querySelector(`[row="${parseInt(lastPressedPiece.parentNode.getAttribute("row"))}"][column="${8}"]`);

			castled = true;
			rook.firstChild.setAttribute("data-moved", "true");
			swapNodes(rook.firstChild, rookNewSquare.firstChild, true, "short");	

		}else if(3 == parseInt(square.parentNode.getAttribute("column"))){//long castled because moved two columns to the left
			const rookNewSquare = document.querySelector(`[row="${parseInt(lastPressedPiece.parentNode.getAttribute("row"))}"][column="${4}"]`);
			const rook = document.querySelector(`[row="${parseInt(lastPressedPiece.parentNode.getAttribute("row"))}"][column="${1}"]`);
			
			castled = true;
			rook.firstChild.setAttribute("data-moved", "true");
			swapNodes(rook.firstChild, rookNewSquare.firstChild, true, "long");
			
		}//else, still move the king normally normally and remove hints and empty divs
		swapNodes(lastPressedPiece, square, castled, null, lastPressedPiece.getAttribute("pieceLetter"));
	}else{
		swapNodes(lastPressedPiece, square, false, null, lastPressedPiece.getAttribute("pieceLetter"));
	}	
}


document.addEventListener('mousedown', (event)=>{
	if(!event.isTrusted && event.cancelable){ //computer move
		let square = event.target.parentNode.querySelector(".empty");
		if(!square){
			square = event.target.parentNode.querySelector(".piece");
		}
		movePiecePosition(lastPressedPiece, square, true);
		switchTurn();
	}else if (event.target.parentNode.querySelector('.hint') && event.target.closest(".board")) {
		let square = event.target.parentNode.querySelector(".empty");
		if(!square){
			square = event.target.parentNode.querySelector(".piece");
		}

		const squareRect = square.getBoundingClientRect();
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		if (
			mouseX >= squareRect.left &&
			mouseX <= squareRect.right &&
			mouseY >= squareRect.top &&
			mouseY <= squareRect.bottom
		) {
			movePiecePosition(lastPressedPiece,square);
			switchTurn();
		}
    }else if (!event.target.closest(".board")){
		removeHints();
	}
});

function allowPieceMovement(){
	pieces.forEach(piece => {
		setCursor("grab");
		piece.addEventListener('mousedown', mousedownDrag);
	});
}
const mousedownDrag = (event) => {
	setCursor("grabbing");
		removeHints();
        if (!isDragging) {
			lastPressedPiece = event.target;
            draggedPiece = event.target;
            isDragging = true;
            event.preventDefault();
        }
		const offsetX = event.clientX - draggedPiece.offsetWidth / 2;
		const offsetY = event.clientY - draggedPiece.offsetHeight / 2;
        draggedPiece.style.position = 'absolute';
        draggedPiece.style.zIndex = 1000;
		draggedPiece.style.width = '70px';
	    draggedPiece.style.height = '70px';
        draggedPiece.style.left = offsetX + 'px';
		draggedPiece.style.top = offsetY + 'px';
        document.addEventListener('mousemove', movePiece);
		

		let maybePin = searchForCapturingPinner(draggedPiece);
		if(maybePin[0]){ //piece is pinned
			console.log("Piece is pinned");
		}
		if(kingElementInCheck){
			let possibleMoves = [];
			if(checkAttackingPiece.length>1){
				possibleMoves.push(getRequiredMovesFromCheck(checkAttackingPiece, kingElementInCheck));
				if(draggedPiece.classList.contains("king")){
					searchMoves(draggedPiece, null, possibleMoves);
				}
			}else{
				if(isPieceAdjacentToKing(checkAttackingPiece[0], kingElementInCheck)){
					possibleMoves.push(checkAttackingPiece[0].parentNode);
					searchMoves(draggedPiece, null, possibleMoves);
				}else{
					possibleMoves.push(checkAttackingPiece[0].parentNode);
					let totalPossible = possibleMoves.concat(getRequiredMovesFromCheck(checkAttackingPiece[0], kingElementInCheck));
					searchMoves(draggedPiece, maybePin[1], totalPossible);
				}
			}
		}else{
			searchMoves(draggedPiece, maybePin[1]);
		}
		

};



function isPieceAdjacentToKing(pieceElement, kingElement) {
	const kingRow = parseInt(kingElement.parentNode.getAttribute("row"));
    const kingColumn = parseInt(kingElement.parentNode.getAttribute("column"));

    const pieceRow = parseInt(pieceElement.parentNode.getAttribute("row"));
    const pieceColumn = parseInt(pieceElement.parentNode.getAttribute("column"));

    return Math.abs(pieceRow - kingRow) <= 1 && Math.abs(pieceColumn - kingColumn) <= 1;
}


function getRequiredMovesFromCheck(pieceElement, kingElement){
	const kingRow = parseInt(kingElement.parentNode.getAttribute("row"));
    const kingColumn = parseInt(kingElement.parentNode.getAttribute("column"));
	if(Array.isArray(pieceElement)){
		const mustMoveKing = [
			document.querySelector(`[row="${kingRow+1}"][column="${kingColumn}"]`),
			document.querySelector(`[row="${kingRow+1}"][column="${kingColumn+1}"]`),
			document.querySelector(`[row="${kingRow+1}"][column="${kingColumn-1}"]`),
			document.querySelector(`[row="${kingRow}"][column="${kingColumn-1}"]`),
			document.querySelector(`[row="${kingRow}"][column="${kingColumn+1}"]`),
			document.querySelector(`[row="${kingRow-1}"][column="${kingColumn}"]`),
			document.querySelector(`[row="${kingRow-1}"][column="${kingColumn+1}"]`),
			document.querySelector(`[row="${kingRow-1}"][column="${kingColumn-1}"]`),
		];
		return mustMoveKing;
	}
	if(pieceElement.classList.contains("knight")){
		return [];
	}
	
    

    const pieceRow = parseInt(pieceElement.parentNode.getAttribute("row"));
    const pieceColumn = parseInt(pieceElement.parentNode.getAttribute("column"));

    const requiredMoves = [];

    const rowDirection = Math.sign(pieceRow - kingRow);
    const columnDirection = Math.sign(pieceColumn - kingColumn);

	let locX = kingColumn + columnDirection;
    let locY = kingRow + rowDirection;
	while (locX !== pieceColumn || locY !== pieceRow) {
        const emptySquare = document.querySelector(`[row="${locY}"][column="${locX}"]`);
        if (emptySquare && emptySquare.firstChild.classList.contains("empty")) {
            requiredMoves.push(emptySquare);
        }

        locX += columnDirection;
        locY += rowDirection;
    }

    return requiredMoves;
}


function movePiece(event) {
		if (isDragging && draggedPiece) {
			draggedPiece.style.left = (event.clientX - draggedPiece.offsetWidth / 2) + 'px';
			draggedPiece.style.top = (event.clientY - draggedPiece.offsetHeight / 2) + 'px';
        }
    }


document.addEventListener('mousemove', (event) => {
	if (isDragging && draggedPiece === event.target) {
		event.target.style.position = 'absolute';
		event.target.style.zIndex = 1000;
		event.target.style.width = '70px';
		event.target.style.height = '70px';
		event.target.style.left = (event.clientX - event.target.offsetWidth / 2) + 'px';
		event.target.style.top = (event.clientY - event.target.offsetHeight / 2) + 'px';
	}
});


document.addEventListener('mouseup', () => {
	if (isDragging && draggedPiece) {
		setCursor("grab");
		
		isDragging = false;

        //Determine the square element based on mouse location
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const emptySquares = document.querySelectorAll('.hint');
		let droppedOnSquare = null;

		emptySquares.forEach(square => {
			const squareRect = square.parentNode.getBoundingClientRect();
			if (
				mouseX >= squareRect.left &&
				mouseX <= squareRect.right &&
				mouseY >= squareRect.top &&
				mouseY <= squareRect.bottom
			) {			
				droppedOnSquare = square;
			}
		});

		if (droppedOnSquare) {
			const squareRect = droppedOnSquare.parentNode.getBoundingClientRect();
			const pieceWidth = draggedPiece.offsetWidth;
			const pieceHeight = draggedPiece.offsetHeight;

			const centerX = squareRect.left + (squareRect.width - pieceWidth) / 2;
			const centerY = squareRect.top + (squareRect.height - pieceHeight) / 2;

			draggedPiece.style.left = centerX + 'px';
			draggedPiece.style.top = centerY + 'px';
			//center it initially, then leave it in place there with the div, moving with the board.
			draggedPiece.style.position = '';
			draggedPiece.style.zIndex = '';
			draggedPiece.style.width = '';
			draggedPiece.style.height = '';
			draggedPiece.style.left = '';
			draggedPiece.style.top = '';
			
			if(droppedOnSquare.parentNode.querySelector(".empty")){
				movePiecePosition(draggedPiece, droppedOnSquare.parentNode.querySelector(".empty"));
			}else{
				movePiecePosition(draggedPiece, droppedOnSquare.parentNode.querySelector(".piece"));
			}
			
			switchTurn();

		} else {
			//Reset the position if not dropped on an empty square
			draggedPiece.style.position = '';
			draggedPiece.style.zIndex = '';
			draggedPiece.style.width = '';
			draggedPiece.style.height = '';
			draggedPiece.style.left = '';
			draggedPiece.style.top = '';
		}
        draggedPiece = null;
	}
});


function boardSetup() {
	for (let r = 8; r >=1 ; r--) {
		for(let c = 1; c<=8; c++){
			let square = document.createElement("div");
			square.classList.add("square");

			pieceSetup(square, r, c);

			square.setAttribute("row", r);
			square.setAttribute("column", c);

			if(r%2==0 && c%2==0 || r%2!=0 && c%2!=0){
				square.style.backgroundColor= "#B58863";
			}else{
				square.style.backgroundColor= "#F0D9B5";
			}
			board.appendChild(square);
		}
	}
}

function printBoardCoords() {
	let visualBoardCoords = "";
	const childElements = Array.from(document.querySelector(".board").children);
	let count = 1;
	childElements.forEach(element => {
		visualBoardCoords+=element.getAttribute("column") + element.getAttribute("row") + " | ";
		if(count==8){
			count=1;
			visualBoardCoords+="\n";
		}else{
			count++;
		}
	});
	console.log(visualBoardCoords);
}

function flipBoard(){
	const board = document.querySelector('.board');
	const squares = Array.from(document.querySelector(".board").children);

	board.innerHTML = '';

	const reversedSquares = squares.reverse();
	
	reversedSquares.forEach(square => {
		board.appendChild(square);
	});
	printBoardCoords();
}

function pieceSetup(square, r, c, piece = null) {
	let startPiece = document.createElement("img");
	if(r==2){
		startPiece.classList.add("piece");
		startPiece.classList.add("wp");
		startPiece.classList.add("white");
		startPiece.src ="./pieceImages/wp.png";
		isBlank = false;
	}else if(r == 7){
		startPiece.classList.add("piece");
		startPiece.classList.add("bp");
		startPiece.classList.add("black");
		startPiece.src = "./pieceImages/bp.png";
	}else if(r==1&&c==1 || r==1&&c==8 || piece=="wr"){
		startPiece.classList.add("piece");
		startPiece.classList.add("wr");
		startPiece.classList.add("white");
		startPiece.src = "./pieceImages/wr.png";
		startPiece.setAttribute("pieceLetter", "R");
		startPiece.setAttribute("data-moved", "false");
	}else if(r==1&&c==2 || r==1&&c==7 || piece == "wn"){
		startPiece.classList.add("piece");
		startPiece.classList.add("wn");
		startPiece.classList.add("knight");
		startPiece.classList.add("white");
		startPiece.setAttribute("pieceLetter", "N");
		startPiece.src = "./pieceImages/wn.png";
	}else if(r==1&&c==3 || r==1&&c==6 || piece == "wb"){
		startPiece.classList.add("piece");
		startPiece.classList.add("wb");
		startPiece.classList.add("white");
		startPiece.setAttribute("pieceLetter", "B");
		startPiece.src = "./pieceImages/wb.png";
	}else if(r==1&&c==4 || piece == "wq"){
		startPiece.classList.add("piece");
		startPiece.classList.add("wq");
		startPiece.classList.add("white");
		startPiece.setAttribute("pieceLetter", "Q");
		startPiece.src = "./pieceImages/wq.png";
	}else if(r==1&&c==5){
		startPiece.classList.add("piece");
		startPiece.classList.add("wk");
		startPiece.classList.add("white");
		startPiece.classList.add("king");
		startPiece.setAttribute("pieceLetter", "K");
		startPiece.src = "./pieceImages/wk.png";
		startPiece.setAttribute("data-moved", "false");
	}else if(r==8&&c==1 || r==8&&c==8 || piece == "br"){
		startPiece.classList.add("piece");
		startPiece.classList.add("br");
		startPiece.classList.add("black");
		startPiece.setAttribute("pieceLetter", "R");
		startPiece.src = "./pieceImages/br.png";
		startPiece.setAttribute("data-moved", "false");
	}else if(r==8&&c==2 || r==8&&c==7 || piece == "bn"){
		startPiece.classList.add("piece");
		startPiece.classList.add("bn");
		startPiece.classList.add("knight");
		startPiece.classList.add("black");
		startPiece.setAttribute("pieceLetter", "N");
		startPiece.src = "./pieceImages/bn.png";
	}else if(r==8&&c==3 || r==8&&c==6 || piece == "bb"){
		startPiece.classList.add("piece");
		startPiece.classList.add("bb");
		startPiece.classList.add("black");
		startPiece.setAttribute("pieceLetter", "B");
		startPiece.src = "./pieceImages/bb.png";
	}else if(r==8&&c==4 || piece == "bq"){
		startPiece.classList.add("piece");
		startPiece.classList.add("bq");
		startPiece.classList.add("black");
		startPiece.setAttribute("pieceLetter", "Q");
		startPiece.src = "./pieceImages/bq.png";
	}else if(r==8&&c==5){
		startPiece.classList.add("piece");
		startPiece.classList.add("bk");
		startPiece.classList.add("black");
		startPiece.classList.add("king");
		startPiece.setAttribute("pieceLetter", "K");
		startPiece.src = "./pieceImages/bk.png";
		startPiece.setAttribute("data-moved", "false");
	}else{
		isBlank = true;
		square.appendChild(newEmpty());
	}
	if(piece){
		startPiece.setAttribute("draggable",false);
		return startPiece;
	}else if(!isBlank){
		startPiece.setAttribute("draggable",false);
		square.appendChild(startPiece);
		isBlank = false;
	}
}

function setCursor(form){
	pieces.forEach(piece => {
		if(piece.classList.contains(turn.textContent.toLowerCase())){
			piece.style.cursor = form;
		}else{
			piece.style.cursor = "auto";
		}
	});
}

function newEmpty() {
	let blank = document.createElement("div");
	blank.classList.add("square");
	blank.classList.add("empty");
	return blank;
}

function removeHints(){
	const hintsToRemove = document.querySelectorAll(".square .hint");
	const passantsToRemove = document.querySelectorAll(".empty.passant");

	hintsToRemove.forEach(hint => {
		hint.remove();
	});
	passantsToRemove.forEach(passant => {
		passant.classList.remove("passant");
	});
}

function getPieceColor(pieceElement){
	let pieceColor = pieceElement.classList.contains("white") ? "white" : "black";
	return pieceColor;
}


function hint(pieceElement, blankSquare, direction, locX, locY, checkingForMate = false) {
	let hasOption = false;
	let squaresInDirection = [];
	const directions = [
        { dx: 1, dy: 0, name: "right" }, //right
        { dx: -1, dy: 0, name: "left" }, //left
        { dx: 0, dy: 1, name: "up" }, //up
        { dx: 0, dy: -1, name: "down" }, //down
        { dx: 1, dy: 1, name: "up right diagonal" }, //up right diagonal
        { dx: -1, dy: 1, name: "up left diagonal" }, //up left diagonal
        { dx: 1, dy: -1, name: "down right diagonal" }, //down right diagonal
        { dx: -1, dy: -1, name: "down left diagonal" } //down left diagonal
    ];
	if (direction) {
        const selectedDirection = directions.find(d => d.name === direction);
		if(selectedDirection){
			for (let i = 1; i <= 8; i++) {
				const x = locX + i * selectedDirection.dx;
				const y = locY + i * selectedDirection.dy;
				const square = document.querySelector(`[row="${y}"][column="${x}"]`);

				if (square) {
					squaresInDirection.push(square);
				}else{
					i = 9;
				}
			}
		}
    }
			if(blankSquare.querySelector(`.piece.${getPieceColor(pieceElement)}`)==null){
				let hint = document.createElement("div");
				hint.classList.add("hint");
				hint.style.backgroundColor = `rgba(0, 0, 0, ${hintTransparency})`;
				if(blankSquare.querySelector(".piece.black")){
					hint.style.backgroundColor = "transparent";
					hint.style.border = `4px solid rgba(0, 0, 0, ${hintTransparency})`;
					hint.style.width = '60px';
					hint.style.height = '60px';
				}
				if(squaresInDirection.length>0){
					if(squaresInDirection.includes(blankSquare)){
						blankSquare.appendChild(hint);
						hasOption = true;
					}
				}else{
					blankSquare.appendChild(hint);
					hasOption = true;
				}
			}
	if(checkingForMate){
		removeHints();
		return hasOption;
	}
}

function switchTurn(){
	pieces.forEach(piece => {
		piece.removeEventListener('mousedown',mousedownDrag);
		setCursor("auto");
	});
	if(turn.textContent == "White"){
		pieces = document.querySelectorAll(".piece.black");
		turn.textContent = "Black";
	}else{
		pieces = document.querySelectorAll(".piece.white");
		turn.textContent = "White";
	}

	allowPieceMovement()
}
function getOppositeDirectionName(direction) {
    const oppositeDirectionMap = {
        "up": "down",
        "down": "up",
        "left": "right",
        "right": "left",
        "up right diagonal": "down left diagonal",
        "up left diagonal": "down right diagonal",
        "down right diagonal": "up left diagonal",
        "down left diagonal": "up right diagonal"
    };

    return oppositeDirectionMap[direction];
}

function findPieceGivingCheck(kingLocation) {
	let locX = parseInt(kingLocation.parentNode.getAttribute("column"));
    let locY = parseInt(kingLocation.parentNode.getAttribute("row"));
    let kingColor = getPieceColor(kingLocation);
    let opponentColor = (kingColor === "white") ? "black" : "white";
	let opponentAbbrev = opponentColor.substring(0,1);

	let piecesGivingChecks = [];
	let potentialCycle = [];
	let pawnLoc = null;

	if(kingColor==="white"){
		pawnLoc = 1;
	}else{
		pawnLoc = -1;
	}

	//pawn
	
	potentialCycle.push(document.querySelector(`[row="${locY+pawnLoc}"][column="${locX+1}"]`));
	potentialCycle.push(document.querySelector(`[row="${locY+pawnLoc}"][column="${locX-1}"]`));
	
	potentialCycle.forEach(square => {
		if (square && square.firstChild.classList.contains(`${opponentAbbrev}p`)) {
			piecesGivingChecks.push(square.firstChild);
		}
	});

	potentialCycle = [];


	//Knight
	
	potentialCycle = [
		document.querySelector(`[row="${locY+2}"][column="${locX+1}"]`),
		document.querySelector(`[row="${locY+1}"][column="${locX+2}"]`),
		document.querySelector(`[row="${locY-1}"][column="${locX+2}"]`),
		document.querySelector(`[row="${locY-2}"][column="${locX+1}"]`),
		document.querySelector(`[row="${locY-2}"][column="${locX-1}"]`),
		document.querySelector(`[row="${locY-1}"][column="${locX-2}"]`),
		document.querySelector(`[row="${locY+2}"][column="${locX-1}"]`),
		document.querySelector(`[row="${locY+1}"][column="${locX-2}"]`),
	];
	
	potentialCycle.forEach(square => {
		if (square && square.firstChild.classList.contains(`${opponentAbbrev}n`)) {
			piecesGivingChecks.push(square.firstChild);
		}
	});

	potentialCycle = [];

	//Bishop
	
	let directions = [
			{ dx: 1, dy: 1 }, //up right diagonal
			{ dx: -1, dy: 1 }, //up left diagonal
			{ dx: 1, dy: -1 }, //down right diagonal
			{ dx: -1, dy: -1 } //down left diagonal
	];
		directions.forEach(direction => {
			let x = locX + direction.dx;
			let y = locY + direction.dy;
			let continueInDirection = true;

			while (x >= 1 && x <= 8 && y >= 1 && y <= 8 && continueInDirection) {
				const square = document.querySelector(`[row="${y}"][column="${x}"]`);
				if(square){
					if(square.firstChild.classList.contains(`${opponentAbbrev}b`)){
						continueInDirection = false;
						potentialCycle.push(square.firstChild);
					}else if(square.firstChild.classList.contains("piece")){
						continueInDirection = false;
					}
				}else{
					continueInDirection = false;
				}
				x += direction.dx;
				y += direction.dy;
			}
		});
	
	potentialCycle.forEach(square => {
		piecesGivingChecks.push(square);
	});

	

	potentialCycle = [];
	//Queen
	

	directions = [
			{ dx: 1, dy: 0 }, //right
			{ dx: -1, dy: 0 }, //left
			{ dx: 0, dy: 1 }, //up
			{ dx: 0, dy: -1 }, //down
			{ dx: 1, dy: 1 }, //up right diagonal
			{ dx: -1, dy: 1 }, //up left diagonal
			{ dx: 1, dy: -1 }, //down right diagonal
			{ dx: -1, dy: -1 } //down left diagonal
		];

	directions.forEach(direction => {
			let x = locX + direction.dx;
			let y = locY + direction.dy;
			let continueInDirection = true;

			while (x >= 1 && x <= 8 && y >= 1 && y <= 8 && continueInDirection) {
				const square = document.querySelector(`[row="${y}"][column="${x}"]`);
				if(square){
					if(square.firstChild.classList.contains(`${opponentAbbrev}q`)){
						continueInDirection = false;
						potentialCycle.push(square.firstChild);
					}else if(square.firstChild.classList.contains("piece")){
						continueInDirection = false;
					}
				}else{
					continueInDirection = false;
				}
				x += direction.dx;
				y += direction.dy;
			}
		});
	
	potentialCycle.forEach(square => {
		piecesGivingChecks.push(square);
	});


	potentialCycle = [];
	//rook
	
	directions = [
			{ dx: 1, dy: 0 }, //right
			{ dx: -1, dy: 0 }, //left
			{ dx: 0, dy: 1 }, //up
			{ dx: 0, dy: -1 }, //down
		];

	directions.forEach(direction => {
			let x = locX + direction.dx;
			let y = locY + direction.dy;
			let continueInDirection = true;

			while (x >= 1 && x <= 8 && y >= 1 && y <= 8 && continueInDirection) {
				const square = document.querySelector(`[row="${y}"][column="${x}"]`);
				if(square){
					if(square.firstChild.classList.contains(`${opponentAbbrev}r`)){
						continueInDirection = false;
						potentialCycle.push(square.firstChild);
					}else if(square.firstChild.classList.contains("piece")){
						continueInDirection = false;
					}
				}else{
					continueInDirection = false;
				}
				x += direction.dx;
				y += direction.dy;
			}
		});
	
	potentialCycle.forEach(square => {
		piecesGivingChecks.push(square);
	});


	return piecesGivingChecks;
}


function searchForCapturingPinner(pieceElement) {
    let locX = parseInt(pieceElement.parentNode.getAttribute("column"));
    let locY = parseInt(pieceElement.parentNode.getAttribute("row"));
    let pieceColor = getPieceColor(pieceElement);
	let kingColor = (pieceColor === "white") ? "wk" : "bk";
    let opponentColor = (pieceColor === "white") ? "black" : "white";
	let opponentAbbrev = opponentColor.substring(0,1);
	

    const directions = [
        { dx: 1, dy: 0, name: "right" }, //right
        { dx: -1, dy: 0, name: "left" }, //left
        { dx: 0, dy: 1, name: "up" }, //up
        { dx: 0, dy: -1, name: "down" }, //down
        { dx: 1, dy: 1, name: "up right diagonal" }, //up right diagonal
        { dx: -1, dy: 1, name: "up left diagonal" }, //up left diagonal
        { dx: 1, dy: -1, name: "down right diagonal" }, //down right diagonal
        { dx: -1, dy: -1, name: "down left diagonal" } //down left diagonal
    ];

    let kingDirection = null;

    for (const direction of directions) {
        let x = locX + direction.dx;
        let y = locY + direction.dy;
        let continueInDirection = true;

        while (x >= 1 && x <= 8 && y >= 1 && y <= 8 && continueInDirection) {
            const square = document.querySelector(`[row="${y}"][column="${x}"]`);
            if (square) {
                if (square.firstChild.classList.contains("piece")) {
					if (kingDirection === null && square.firstChild.classList.contains(kingColor)) {
                        kingDirection = direction.name;
                    }else {
                        continueInDirection = false; // Stop checking this direction
                    }
				}
            }
            x += direction.dx;
            y += direction.dy;
        }
    }

    if (kingDirection) {
		const oppositeDirection = directions.find(d => d.name === getOppositeDirectionName(kingDirection));
        if (oppositeDirection) {
            let x = locX + oppositeDirection.dx;
            let y = locY + oppositeDirection.dy;

            while (x >= 1 && x <= 8 && y >= 1 && y <= 8) {
                const square = document.querySelector(`[row="${y}"][column="${x}"]`);
                if (square) {
					if(square.firstChild.classList.contains("piece") && square.firstChild.classList.contains(pieceColor)){
						return [false, null, lastPressedPiece];
					}else if (square.firstChild.classList.contains("piece") && square.firstChild.classList.contains(opponentColor)) {
						if((oppositeDirection.name === "right" || oppositeDirection.name === "left" || oppositeDirection.name === "up" || oppositeDirection.name === "down") && square.firstChild.classList.contains(`${opponentAbbrev}r`) || square.firstChild.classList.contains(`${opponentAbbrev}q`)){
							return [true, oppositeDirection.name, square.firstChild];

						}else if((oppositeDirection.name === "up right diagonal" || oppositeDirection.name === "up left diagonal" || oppositeDirection.name === "down right diagonal" || oppositeDirection.name === "down left diagonal") && square.firstChild.classList.contains(`${opponentAbbrev}b`) || square.firstChild.classList.contains(`${opponentAbbrev}q`)){
							return [true, oppositeDirection.name, square.firstChild];
						}else{
							return [false, null, lastPressedPiece];
						}
                    }
                }
                x += oppositeDirection.dx;
                y += oppositeDirection.dy;
            }
        }
    }

	return [false, null, lastPressedPiece];
}

function searchMoves(pieceElement, pinForceDirection = null, mustGoSquare = null, checkingForMate = false){
	let locX = parseInt(pieceElement.parentNode.getAttribute("column"));
	let locY = parseInt(pieceElement.parentNode.getAttribute("row"));
	let oppColorTest = (getPieceColor(pieceElement)==="white") ? "black" : "white";
	let saveReturn = null;

	if(pieceElement.classList.contains("wp")){
		let oneForward =  document.querySelector(`[row="${locY+1}"][column="${locX}"]`);
		let twoForward =  document.querySelector(`[row="${locY+2}"][column="${locX}"]`);
		if(oneForward && oneForward.querySelector(".piece")==null){
			if (!mustGoSquare || mustGoSquare.includes(oneForward)) {
				if(checkingForMate){
					if(!saveReturn){
						saveReturn = hint(pieceElement, oneForward, pinForceDirection, locX, locY, checkingForMate);
					}
				}else{
					hint(pieceElement, oneForward, pinForceDirection, locX, locY, checkingForMate);
				}
			}
		}
		if(twoForward && twoForward.querySelector(".piece")==null && oneForward && oneForward.querySelector(".piece")==null && locY==2){
			if(!mustGoSquare || mustGoSquare.includes(twoForward)){
				if(checkingForMate){
					if(!saveReturn){
						saveReturn = hint(pieceElement, twoForward, pinForceDirection, locX, locY, checkingForMate);
					}
				}else{
					hint(pieceElement, twoForward, pinForceDirection, locX, locY, checkingForMate);
				}
			}
		}


		let attackSquareRight = document.querySelector(`[row="${locY+1}"][column="${locX+1}"]`);
		let attackSquareLeft = document.querySelector(`[row="${locY+1}"][column="${locX-1}"]`);

		if(attackSquareRight && attackSquareRight.querySelector(".piece")){
			if(!mustGoSquare || mustGoSquare.includes(attackSquareRight)){
				if(checkingForMate){
					if(!saveReturn){
						saveReturn = hint(pieceElement, attackSquareRight, pinForceDirection, locX, locY, checkingForMate);
					}
				}else{
					hint(pieceElement, attackSquareRight, pinForceDirection, locX, locY, checkingForMate);
				}
			}
		}
		if(attackSquareLeft && attackSquareLeft.querySelector(".piece")){
			if(!mustGoSquare || mustGoSquare.includes(attackSquareLeft)){
				if(checkingForMate){
					if(!saveReturn){
						saveReturn = hint(pieceElement, attackSquareLeft, pinForceDirection, locX, locY, checkingForMate);
					}
				}else{
					hint(pieceElement, attackSquareLeft, pinForceDirection, locX, locY, checkingForMate);
				}
			}
		}

		let passents = [];
		const potentialEnPassantSquareOne = document.querySelector(`[row="${locY+1}"][column="${locX-1}"]`);
		const potentialEnPassantSquareTwo = document.querySelector(`[row="${locY+1}"][column="${locX+1}"]`);
		passents.push(potentialEnPassantSquareOne);
		passents.push(potentialEnPassantSquareTwo);

		passents.forEach(potentialEnPassantSquare => {
			if (potentialEnPassantSquare){
				if(lastMove && lastMove.classList.contains("bp")){
					if (
						Math.abs(parseInt(lastMoveToSquare.getAttribute("row")) - parseInt(lastMoveOldSquare.getAttribute("row"))) == 2 && lastMoveToSquare.getAttribute("column") == potentialEnPassantSquare.getAttribute("column") && pieceElement.parentNode.getAttribute("row") == "5"
					) {
						if(!mustGoSquare || mustGoSquare.includes(potentialEnPassantSquare)){
							potentialEnPassantSquare.querySelector(".empty").classList.add("passant");
							if(checkingForMate){
								if(!saveReturn){
									saveReturn = hint(pieceElement, potentialEnPassantSquare, pinForceDirection, locX, locY, checkingForMate);
								}
							}else{
								hint(pieceElement, potentialEnPassantSquare, pinForceDirection, locX, locY, checkingForMate);
							}
						}
					}
				}
			}
		});
		
	}else if(pieceElement.classList.contains("bp")){
		let oneForward =  document.querySelector(`[row="${locY-1}"][column="${locX}"]`);
		let twoForward =  document.querySelector(`[row="${locY-2}"][column="${locX}"]`);
		if(oneForward && oneForward.querySelector(".piece")==null){
			if(!mustGoSquare || mustGoSquare.includes(oneForward)){
				if(checkingForMate){
					if(!saveReturn){
						saveReturn = hint(pieceElement, oneForward, pinForceDirection, locX, locY, checkingForMate);
					}
				}else{
					hint(pieceElement, oneForward, pinForceDirection, locX, locY, checkingForMate);
				}
			}
		}
		if(twoForward && twoForward.querySelector(".piece")==null && oneForward && oneForward.querySelector(".piece")==null && locY==7){
			if(!mustGoSquare || mustGoSquare.includes(twoForward)){
				if(checkingForMate){
					if(!saveReturn){
						saveReturn = hint(pieceElement, twoForward, pinForceDirection, locX, locY, checkingForMate);
					}
				}else{
					hint(pieceElement, twoForward, pinForceDirection, locX, locY, checkingForMate);
				}
			}
		}
		
		let attackSquareRight = document.querySelector(`[row="${locY-1}"][column="${locX+1}"]`);
		let attackSquareLeft = document.querySelector(`[row="${locY-1}"][column="${locX-1}"]`);

		if(attackSquareRight && attackSquareRight.querySelector(".piece")){
			if(!mustGoSquare || mustGoSquare.includes(attackSquareRight)){
				if(checkingForMate){
					if(!saveReturn){
						saveReturn = hint(pieceElement, attackSquareRight, pinForceDirection, locX, locY, checkingForMate);
					}
				}else{
					hint(pieceElement, attackSquareRight, pinForceDirection, locX, locY, checkingForMate);
				}
			}
		}
		if(attackSquareLeft && attackSquareLeft.querySelector(".piece")){
			if(!mustGoSquare || mustGoSquare.includes(attackSquareLeft)){
				if(checkingForMate){
					if(!saveReturn){
						saveReturn = hint(pieceElement, attackSquareLeft, pinForceDirection, locX, locY, checkingForMate);
					}
				}else{
					hint(pieceElement, attackSquareLeft, pinForceDirection, locX, locY, checkingForMate);
				}
			}
		}

		let passents = [];
		const potentialEnPassantSquareOne = document.querySelector(`[row="${locY-1}"][column="${locX-1}"]`);
		const potentialEnPassantSquareTwo = document.querySelector(`[row="${locY-1}"][column="${locX+1}"]`);
		passents.push(potentialEnPassantSquareOne);
		passents.push(potentialEnPassantSquareTwo);

		passents.forEach(potentialEnPassantSquare => {
			if (potentialEnPassantSquare){
				if(lastMove && lastMove.classList.contains("wp")){
					if (
						Math.abs(parseInt(lastMoveToSquare.getAttribute("row")) - parseInt(lastMoveOldSquare.getAttribute("row"))) == 2 && lastMoveToSquare.getAttribute("column") == potentialEnPassantSquare.getAttribute("column") && pieceElement.parentNode.getAttribute("row") == "4"
					) {
						if(!mustGoSquare || mustGoSquare.includes(potentialEnPassantSquare)){
							potentialEnPassantSquare.querySelector(".empty").classList.add("passant");
							if(checkingForMate){
								if(!saveReturn){
									saveReturn = hint(pieceElement, potentialEnPassantSquare, pinForceDirection, locX, locY, checkingForMate);
								}
							}else{
								hint(pieceElement, potentialEnPassantSquare, pinForceDirection, locX, locY, checkingForMate);
							}
						}
					}
				}
			}
		});
	}else if(pieceElement.classList.contains("wk") || pieceElement.classList.contains("bk")){
		const potentialHintSquares = [
			document.querySelector(`[row="${locY+1}"][column="${locX}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX-1}"]`),
		];

		if (pieceElement.getAttribute("data-moved") === "false") {
			const rookRight = document.querySelector(`[row="${locY}"][column="${locX + 3}"]`);
			const rookLeft = document.querySelector(`[row="${locY}"][column="${locX - 4}"]`);

			if (rookRight && rookRight.firstChild && rookRight.firstChild.classList.contains("piece") && rookRight.firstChild.getAttribute("data-moved") === "false") {
				if(kingElementInCheck==null && document.querySelector(`[row="${locY}"][column="${locX + 1}"]`).firstChild.classList.contains("empty") && !isSquareAttackedByColor(locY, locX+1, oppColorTest)){
					potentialHintSquares.push(document.querySelector(`[row="${locY}"][column="${locX + 2}"]`));
				}
			}

			if (rookLeft && rookLeft.firstChild && rookLeft.firstChild.classList.contains("piece") && rookLeft.firstChild.getAttribute("data-moved") === "false") {
				if(kingElementInCheck==null && document.querySelector(`[row="${locY}"][column="${locX - 1}"]`).firstChild.classList.contains("empty") && !isSquareAttackedByColor(locY, locX-1, oppColorTest) && document.querySelector(`[row="${locY}"][column="${locX - 3}"]`).firstChild.classList.contains("empty")){
					potentialHintSquares.push(document.querySelector(`[row="${locY}"][column="${locX - 2}"]`));
				}
			}
		}
		potentialHintSquares.forEach(square => {
			if (square) {
				if(isSquareAttackedByColor(parseInt(square.getAttribute("row")), parseInt(square.getAttribute("column")), oppColorTest)){

				}else{
					//doesnt need mustGo, because the king cant block
					updateAttackedSquares(pieceElement);
					if(!isSquareAttackedByColor(parseInt(square.getAttribute("row")), parseInt(square.getAttribute("column")), oppColorTest)){
						//makes sure the king doesnt move backwards, still in line with a queen or rook or bishop
						updateAttackedSquares();
						if(checkingForMate){
							if(!saveReturn){
								saveReturn = hint(pieceElement, square, null, locX, locY, checkingForMate);
							}
						}else{
							hint(pieceElement, square, null, locX, locY, checkingForMate);
						}
					}else{
						updateAttackedSquares();
					}
				}
			}
		});
		
	}else if(pieceElement.classList.contains("wq") || pieceElement.classList.contains("bq")){
		const directions = [
			{ dx: 1, dy: 0 }, //right
			{ dx: -1, dy: 0 }, //left
			{ dx: 0, dy: 1 }, //up
			{ dx: 0, dy: -1 }, //down
			{ dx: 1, dy: 1 }, //up right diagonal
			{ dx: -1, dy: 1 }, //up left diagonal
			{ dx: 1, dy: -1 }, //down right diagonal
			{ dx: -1, dy: -1 } //down left diagonal
		];
		directions.forEach(direction => {
			let x = locX + direction.dx;
			let y = locY + direction.dy;
			let continueInDirection = true;

			while (x >= 1 && x <= 8 && y >= 1 && y <= 8 && continueInDirection) {
				const square = document.querySelector(`[row="${y}"][column="${x}"]`);
				if(square){
					if(square.firstChild.classList.contains("piece")){
						continueInDirection = false;
					}
					if(!mustGoSquare || mustGoSquare.includes(square)){
						if(checkingForMate){
							if(!saveReturn){
								saveReturn = hint(pieceElement, square, pinForceDirection, locX, locY, checkingForMate);
							}
						}else{
							hint(pieceElement, square, pinForceDirection, locX, locY, checkingForMate);
						}
					}
				}else{
					continueInDirection = false;
				}
				x += direction.dx;
				y += direction.dy;
			}
		});
	}else if(pieceElement.classList.contains("wb") || pieceElement.classList.contains("bb")){
		const directions = [
			{ dx: 1, dy: 1 }, //up right diagonal
			{ dx: -1, dy: 1 }, //up left diagonal
			{ dx: 1, dy: -1 }, //down right diagonal
			{ dx: -1, dy: -1 } //down left diagonal
		];
		directions.forEach(direction => {
			let x = locX + direction.dx;
			let y = locY + direction.dy;
			let continueInDirection = true;

			while (x >= 1 && x <= 8 && y >= 1 && y <= 8 && continueInDirection) {
				const square = document.querySelector(`[row="${y}"][column="${x}"]`);
				if(square){
					if(square.firstChild.classList.contains("piece")){
						continueInDirection = false;
					}
					if(!mustGoSquare || mustGoSquare.includes(square)){
						if(checkingForMate){
							if(!saveReturn){
								saveReturn = hint(pieceElement, square, pinForceDirection, locX, locY, checkingForMate);
							}
						}else{
							hint(pieceElement, square, pinForceDirection, locX, locY, checkingForMate);
						}
					}
				}else{
					continueInDirection = false;
				}
				x += direction.dx;
				y += direction.dy;
			}
		});
	}else if(pieceElement.classList.contains("wn") || pieceElement.classList.contains("bn")){
		const potentialHintSquares = [
			document.querySelector(`[row="${locY+2}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX+2}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX+2}"]`),
			document.querySelector(`[row="${locY-2}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY-2}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX-2}"]`),
			document.querySelector(`[row="${locY+2}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX-2}"]`),
		];
		potentialHintSquares.forEach(square => {
			if (square) {
				if(!mustGoSquare || mustGoSquare.includes(square)){
					if(checkingForMate){
						if(!saveReturn){
							saveReturn = hint(pieceElement, square, pinForceDirection, locX, locY, checkingForMate);
						}
					}else{
						hint(pieceElement, square, pinForceDirection, locX, locY, checkingForMate);
					}
				}
			}
		});
	}else if(pieceElement.classList.contains("wr") || pieceElement.classList.contains("br")){
		const directions = [
			{ dx: 1, dy: 0 }, //right
			{ dx: -1, dy: 0 }, //left
			{ dx: 0, dy: 1 }, //up
			{ dx: 0, dy: -1 }, //down
		];
		directions.forEach(direction => {
			let x = locX + direction.dx;
			let y = locY + direction.dy;
			let continueInDirection = true;

			while (x >= 1 && x <= 8 && y >= 1 && y <= 8 && continueInDirection) {
				const square = document.querySelector(`[row="${y}"][column="${x}"]`);
				if(square){
					if(square.firstChild.classList.contains("piece")){
						continueInDirection = false;
					}
					if(!mustGoSquare || mustGoSquare.includes(square)){
						if(checkingForMate){
							if(!saveReturn){
								saveReturn = hint(pieceElement, square, pinForceDirection, locX, locY, checkingForMate);
							}
						}else{
							hint(pieceElement, square, pinForceDirection, locX, locY, checkingForMate);
						}
					}
				}else{
					continueInDirection = false;
				}
				x += direction.dx;
				y += direction.dy;
			}
		});
	}
	return saveReturn;
}


function isSquareAttackedByColor(row, column, color) {
	const squares = attackedSquares[color];
	for (const square of squares) {
		const squareRow = parseInt(square.getAttribute('row'));
		const squareColumn = parseInt(square.getAttribute('column'));
		if (squareRow === row && squareColumn === column) {
			return true;
		}
	}
	return false;
}
function updateAttackedSquares(omit = null) {
    let pieceOptions = document.querySelectorAll(".piece");

    // Clear both attackedSquares arrays
    attackedSquares.white = [];
    attackedSquares.black = [];

    pieceOptions.forEach(piece => {
		const color = getPieceColor(piece);
        
        const attackingSquares = getAttackingSquares(piece, omit);
        
        attackingSquares.forEach(square => {
            if (color === "white") {
                attackedSquares.white.push(square);
            } else {
                attackedSquares.black.push(square);
            }
        });
    });
}

function isCheckmate(kingElementInQuestion, onlyMoves, onlyKingCanMove = false){
	const color = getPieceColor(kingElementInQuestion);
	const oppColor = (color==="white") ? "Black" : "White";
	const availablePieces = document.querySelectorAll(`.piece.${color}`);
	let checkmate = true;
	if(onlyKingCanMove){
		let maybePin = searchForCapturingPinner(kingElementInQuestion);
		if(searchMoves(kingElementInQuestion, maybePin[1], onlyMoves, true)){
			checkmate = false;
		}
	}else{
		availablePieces.forEach(piece => {
			let maybePin = searchForCapturingPinner(piece);
			if(searchMoves(piece, maybePin[1], onlyMoves, true)){
				checkmate = false;
			}
		});
	}
	if(checkmate){
		confirmedCheckmate = true;
		result = (oppColor.toLowerCase() === "white")? "1-0" : "0-1";
		statusText.textContent = `Checkmate. ${oppColor} wins.`;
	}
}


function isKingChecked(color = "none", showResult = true){
	let kings;
	if(color!="none"){
		kings = document.querySelectorAll(`.piece.king.${color}`);
	}else{
		kings = document.querySelectorAll(`.piece.king`);
	}
	let noChecks = true;

    kings.forEach(king => {
		const opponentColor = (king.classList.contains("white")) ? "black" : "white";
		const kingColor = (opponentColor == "white") ? "black" : "white";
        const kingRow = parseInt(king.parentNode.getAttribute("row"));
        const kingColumn = parseInt(king.parentNode.getAttribute("column"));

        if (isSquareAttackedByColor(kingRow, kingColumn, opponentColor)) {
			kingElementInCheck = king;
			if(showResult){
				console.log(kingColor + " is in check");
				statusText.textContent = kingColor.substring(0,1).toUpperCase()+kingColor.substring(1,kingColor.length) + " is in check";
			}
			
			checkAttackingPiece = findPieceGivingCheck(king);

			let possibleMoves = [];
			if(checkAttackingPiece.length>1){
				possibleMoves.push(getRequiredMovesFromCheck(checkAttackingPiece, kingElementInCheck));
				isCheckmate(kingElementInCheck, possibleMoves, true);
			}else{
				if(isPieceAdjacentToKing(checkAttackingPiece[0], kingElementInCheck)){
					possibleMoves.push(checkAttackingPiece[0].parentNode);
					isCheckmate(kingElementInCheck,possibleMoves);
				}else{
					possibleMoves.push(checkAttackingPiece[0].parentNode);
					let totalPossible = possibleMoves.concat(getRequiredMovesFromCheck(checkAttackingPiece[0], kingElementInCheck));
					isCheckmate(kingElementInCheck,totalPossible);
				}
			}
			noChecks = false;
        }
    });
	if(noChecks){
		kingElementInCheck = null;
		statusText.textContent = " ";
	}
}

function getAttackingSquares(pieceElement, omit) {
	const locX = parseInt(pieceElement.parentNode.getAttribute('column'));
	const locY = parseInt(pieceElement.parentNode.getAttribute('row'));
  
	const attackingSquares = [];
	if (pieceElement.classList.contains('wp')) {
		const potentialHintSquares = [
			document.querySelector(`[row="${locY+1}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX+1}"]`)
		];

		potentialHintSquares.forEach(square => {
			if (square) {
				attackingSquares.push(square);
			}
		});
	}else if(pieceElement.classList.contains("bp")){
		const potentialHintSquares = [
			document.querySelector(`[row="${locY-1}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX+1}"]`)
		];

		potentialHintSquares.forEach(square => {
			if (square) {
				attackingSquares.push(square);
			}
		});
	}else if(pieceElement.classList.contains("wk") || pieceElement.classList.contains("bk")){
		const potentialHintSquares = [
			document.querySelector(`[row="${locY+1}"][column="${locX}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX-1}"]`),
		];

		potentialHintSquares.forEach(square => {
			if (square) {
				attackingSquares.push(square);
			}
		});
	}else if(pieceElement.classList.contains("wq") || pieceElement.classList.contains("bq")){
		const directions = [
			{ dx: 1, dy: 0 }, //right
			{ dx: -1, dy: 0 }, //left
			{ dx: 0, dy: 1 }, //up
			{ dx: 0, dy: -1 }, //down
			{ dx: 1, dy: 1 }, //up right diagonal
			{ dx: -1, dy: 1 }, //up left diagonal
			{ dx: 1, dy: -1 }, //down right diagonal
			{ dx: -1, dy: -1 } //down left diagonal
		];
		directions.forEach(direction => {
			let x = locX + direction.dx;
			let y = locY + direction.dy;
			let continueInDirection = true;

			while (x >= 1 && x <= 8 && y >= 1 && y <= 8 && continueInDirection) {
				const square = document.querySelector(`[row="${y}"][column="${x}"]`);
				if(square){
					if(square.firstChild.classList.contains("piece")){
						if(square.firstChild != omit){
							continueInDirection = false;
						}
					}
					attackingSquares.push(square);
				}
				x += direction.dx;
				y += direction.dy;
			}
		});
	}else if(pieceElement.classList.contains("wb") || pieceElement.classList.contains("bb")){
		const directions = [
			{ dx: 1, dy: 1 }, //up right diagonal
			{ dx: -1, dy: 1 }, //up left diagonal
			{ dx: 1, dy: -1 }, //down right diagonal
			{ dx: -1, dy: -1 } //down left diagonal
		];
		directions.forEach(direction => {
			let x = locX + direction.dx;
			let y = locY + direction.dy;
			let continueInDirection = true;

			while (x >= 1 && x <= 8 && y >= 1 && y <= 8 && continueInDirection) {
				const square = document.querySelector(`[row="${y}"][column="${x}"]`);
				if(square){
					if(square.firstChild.classList.contains("piece")){
						if(square.firstChild != omit){
							continueInDirection = false;
						}
					}
					attackingSquares.push(square);
				}else{
					continueInDirection = false;
				}
				x += direction.dx;
				y += direction.dy;
			}
		});
	}else if(pieceElement.classList.contains("wn") || pieceElement.classList.contains("bn")){
		const potentialHintSquares = [
			document.querySelector(`[row="${locY+2}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX+2}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX+2}"]`),
			document.querySelector(`[row="${locY-2}"][column="${locX+1}"]`),
			document.querySelector(`[row="${locY-2}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY-1}"][column="${locX-2}"]`),
			document.querySelector(`[row="${locY+2}"][column="${locX-1}"]`),
			document.querySelector(`[row="${locY+1}"][column="${locX-2}"]`),
		];
		potentialHintSquares.forEach(square => {
			if (square) {
				attackingSquares.push(square);
			}
		});
	}else if(pieceElement.classList.contains("wr") || pieceElement.classList.contains("br")){
		const directions = [
			{ dx: 1, dy: 0 }, //right
			{ dx: -1, dy: 0 }, //left
			{ dx: 0, dy: 1 }, //up
			{ dx: 0, dy: -1 }, //down
		];
		directions.forEach(direction => {
			let x = locX + direction.dx;
			let y = locY + direction.dy;
			let continueInDirection = true;

			while (x >= 1 && x <= 8 && y >= 1 && y <= 8 && continueInDirection) {
				const square = document.querySelector(`[row="${y}"][column="${x}"]`);
				if(square){
					if(square.firstChild.classList.contains("piece")){
						if(square.firstChild != omit){
							continueInDirection = false;
						}
					}
					attackingSquares.push(square);
				}else{
					continueInDirection = false;
				}
				x += direction.dx;
				y += direction.dy;
			}
		});
	}
	return attackingSquares;
}


allowPieceMovement();
