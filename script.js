const board = document.querySelector(".board");

let turn = document.querySelector(".turn");
let isBlank = false;

let draggedPiece = null;
let lastPressedPiece = null;

boardSetup();

let pieces = document.querySelectorAll(".piece.white");
const attackedSquares = {
	white: [], 
	black: [],
};

updateAttackedSquares();




let isDragging = false;

function swapNodes(lastPressedPiece, square){	
	lastPressedPiece.parentNode.appendChild(newEmpty());
	square.parentNode.appendChild(lastPressedPiece);  
	removeHints();
	square.remove();
	updateAttackedSquares();
	console.log(attackedSquares.white);
	console.log(attackedSquares.black);
	console.log(isSquareAttackedByColor(3,5,"black"));
}

function movePiecePosition(lastPressedPiece, square){//lastPressedPiece is the actual piece element. Square is the empty div element
	if(lastPressedPiece.classList.contains("wr") && lastPressedPiece.getAttribute("data-moved")=="false" || lastPressedPiece.classList.contains("br") && lastPressedPiece.getAttribute("data-moved")=="false"){
		lastPressedPiece.setAttribute("data-moved", "true");

		swapNodes(lastPressedPiece, square);
		
	}else if(lastPressedPiece.classList.contains("wk") && lastPressedPiece.getAttribute("data-moved")=="false"|| lastPressedPiece.classList.contains("bk") && lastPressedPiece.getAttribute("data-moved")=="false"){
		lastPressedPiece.setAttribute("data-moved", "true");
		//take care of moving the rook over in castling
		//kingStartingSquareColumn = 5;
		if(7 == parseInt(square.parentNode.getAttribute("column"))){//short castled because moved two columns to the right
			const rookNewSquare = document.querySelector(`[row="${parseInt(lastPressedPiece.parentNode.getAttribute("row"))}"][column="${6}"]`);
			const rook = document.querySelector(`[row="${parseInt(lastPressedPiece.parentNode.getAttribute("row"))}"][column="${8}"]`);
			
			rook.firstChild.setAttribute("data-moved", "true");
			swapNodes(rook.firstChild, rookNewSquare.firstChild);	

		}else if(3 == parseInt(square.parentNode.getAttribute("column"))){//long castled because moved two columns to the left
			const rookNewSquare = document.querySelector(`[row="${parseInt(lastPressedPiece.parentNode.getAttribute("row"))}"][column="${4}"]`);
			const rook = document.querySelector(`[row="${parseInt(lastPressedPiece.parentNode.getAttribute("row"))}"][column="${1}"]`);

			rook.firstChild.setAttribute("data-moved", "true");
			swapNodes(rook.firstChild, rookNewSquare.firstChild);
			
		}//else, still move the king normally normally and remove hints and empty divs
		swapNodes(lastPressedPiece, square);
	}else{
		swapNodes(lastPressedPiece, square);
	}	
}


document.addEventListener('mousedown', (event)=>{
	if (event.target.parentNode.querySelector('.hint') && event.target.tagName!="BODY") {
		const square = event.target;
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
		searchMoves(draggedPiece);

};
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
		const emptySquares = document.querySelectorAll('.square.empty');
		let droppedOnSquare = null;

		emptySquares.forEach(square => {
			const hasHint = square.parentNode.querySelector(".hint");
			const squareRect = square.getBoundingClientRect();
			if (
				mouseX >= squareRect.left &&
				mouseX <= squareRect.right &&
				mouseY >= squareRect.top &&
				mouseY <= squareRect.bottom &&
				hasHint != null
			) {
				droppedOnSquare = square;
			}
		});

		if (droppedOnSquare) {
			const squareRect = droppedOnSquare.getBoundingClientRect();
			const pieceWidth = draggedPiece.offsetWidth;
			const pieceHeight = draggedPiece.offsetHeight;

			const centerX = squareRect.left + (squareRect.width - pieceWidth) / 2;
			const centerY = squareRect.top + (squareRect.height - pieceHeight) / 2;

			draggedPiece.style.left = centerX + 'px';
			draggedPiece.style.top = centerY + 'px';

			movePiecePosition(draggedPiece, droppedOnSquare);
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



function pieceSetup(square, r, c) {
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
	}else if(r==1&&c==1 || r==1&&c==8){
		startPiece.classList.add("piece");
		startPiece.classList.add("wr");
		startPiece.classList.add("white");
		startPiece.src = "./pieceImages/wr.png";
		startPiece.setAttribute("data-moved", "false");
	}else if(r==1&&c==2 || r==1&&c==7){
		startPiece.classList.add("piece");
		startPiece.classList.add("wn");
		startPiece.classList.add("white");
		startPiece.src = "./pieceImages/wn.png";
	}else if(r==1&&c==3 || r==1&&c==6){
		startPiece.classList.add("piece");
		startPiece.classList.add("wb");
		startPiece.classList.add("white");
		startPiece.src = "./pieceImages/wb.png";
	}else if(r==1&&c==4){
		startPiece.classList.add("piece");
		startPiece.classList.add("wq");
		startPiece.classList.add("white");
		startPiece.src = "./pieceImages/wq.png";
	}else if(r==1&&c==5){
		startPiece.classList.add("piece");
		startPiece.classList.add("wk");
		startPiece.classList.add("white");
		startPiece.src = "./pieceImages/wk.png";
		startPiece.setAttribute("data-moved", "false");
	}else if(r==8&&c==1 || r==8&&c==8){
		startPiece.classList.add("piece");
		startPiece.classList.add("br");
		startPiece.classList.add("black");
		startPiece.src = "./pieceImages/br.png";
		startPiece.setAttribute("data-moved", "false");
	}else if(r==8&&c==2 || r==8&&c==7){
		startPiece.classList.add("piece");
		startPiece.classList.add("bn");
		startPiece.classList.add("black");
		startPiece.src = "./pieceImages/bn.png";
	}else if(r==8&&c==3 || r==8&&c==6){
		startPiece.classList.add("piece");
		startPiece.classList.add("bb");
		startPiece.classList.add("black");
		startPiece.src = "./pieceImages/bb.png";
	}else if(r==8&&c==4){
		startPiece.classList.add("piece");
		startPiece.classList.add("bq");
		startPiece.classList.add("black");
		startPiece.src = "./pieceImages/bq.png";
	}else if(r==8&&c==5){
		startPiece.classList.add("piece");
		startPiece.classList.add("bk");
		startPiece.classList.add("black");
		startPiece.src = "./pieceImages/bk.png";
		startPiece.setAttribute("data-moved", "false");
	}else{
		isBlank = true;
		square.appendChild(newEmpty());
	}
	if(!isBlank){
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
	const hintsToRemove = document.querySelectorAll(".square .hint")

	hintsToRemove.forEach(hint => {
		hint.remove();
	});
}

function hint(blankSquare) {
	if (blankSquare.querySelector(".hint") == null && blankSquare.querySelector(".piece")==null) {
		let hint = document.createElement("div");
		hint.classList.add("hint");

		blankSquare.appendChild(hint);
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

function searchMoves(pieceElement){
	let locX = parseInt(pieceElement.parentNode.getAttribute("column"));
	let locY = parseInt(pieceElement.parentNode.getAttribute("row"));

	if(pieceElement.classList.contains("wp")){
		hint(document.querySelector(`[row="${locY+1}"][column="${locX}"]`));
		if(locY == 2){
			if(document.querySelector(`[row="${locY+1}"][column="${locX}"]`).querySelector(".piece")==null){
				hint(document.querySelector(`[row="${locY+2}"][column="${locX}"]`));
			}
		}
	}else if(pieceElement.classList.contains("bp")){
		hint(document.querySelector(`[row="${locY-1}"][column="${locX}"]`));
		if(locY == 7){
			if(document.querySelector(`[row="${locY-1}"][column="${locX}"]`).querySelector(".piece")==null){
				hint(document.querySelector(`[row="${locY-2}"][column="${locX}"]`));
			}
		}
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
				potentialHintSquares.push(document.querySelector(`[row="${locY}"][column="${locX + 2}"]`));
			}

			if (rookLeft && rookLeft.firstChild && rookLeft.firstChild.classList.contains("piece") && rookLeft.firstChild.getAttribute("data-moved") === "false") {
				potentialHintSquares.push(document.querySelector(`[row="${locY}"][column="${locX - 2}"]`));
			}
		}
		potentialHintSquares.forEach(square => {
			if (square) {
				if(turn.textContent.toLowerCase() == "white" && isSquareAttackedByColor(parseInt(square.getAttribute("row")), parseInt(square.getAttribute("column")), "black")){

				}else if(turn.textContent.toLowerCase() == "black" && isSquareAttackedByColor(parseInt(square.getAttribute("row")), parseInt(square.getAttribute("column")), "white")){

				}else{
					hint(square);
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
				if(square && square.firstChild.classList.contains("empty")){
					hint(square);
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
				if(square && square.firstChild.classList.contains("empty")){
					hint(square);
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
				hint(square);
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
				if(square && square.firstChild.classList.contains("empty")){
					hint(square);
				}else{
					continueInDirection = false;
				}
				x += direction.dx;
				y += direction.dy;
			}
		});
	}

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


function updateAttackedSquares() {
	console.log(turn.textContent);
	if(turn.textContent.toLowerCase()=="white"){
		attackedSquares.white = [];
	}else{
		attackedSquares.black = [];
	}

	pieces.forEach(piece => {
		if (piece.classList.contains('white')) {	
			const attackingSquares = getAttackingSquares(piece);
			attackingSquares.forEach(square => attackedSquares.white.push(square));
		} else {	
			const attackingSquares = getAttackingSquares(piece);
			attackingSquares.forEach(square => attackedSquares.black.push(square));
		}
	});
}

function getAttackingSquares(pieceElement) {
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
						continueInDirection = false;
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
						continueInDirection = false;
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
						continueInDirection = false;
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
