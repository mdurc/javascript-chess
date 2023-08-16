const board = document.querySelector(".board");

let turn = document.querySelector(".turn");
let isBlank = false;

let draggedPiece = null;
let lastPressedPiece = null;

boardSetup();

let pieces = document.querySelectorAll(".piece.white");


let isDragging = false;

let whiteCanCastle = true;
let blackCanCastle = true;


document.addEventListener('mousedown', (event)=>{
	if (event.target.parentNode.querySelector('.hint')) {
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
			lastPressedPiece.parentNode.appendChild(newEmpty());
			square.parentNode.appendChild(lastPressedPiece);
			if(lastPressedPiece.classList.contains("wk") || lastPressedPiece.classList.contains("wr")){
				whiteCanCastle = false;
			}else if(lastPressedPiece.classList.contains("bk") || lastPressedPiece.classList.contains("br")){
				blackCanCastle = false;
			}
			removeHints();
			square.remove();
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

			draggedPiece.parentNode.appendChild(newEmpty());
			droppedOnSquare.parentNode.appendChild(draggedPiece);
			if(draggedPiece.classList.contains("wk") || draggedPiece.classList.contains("wr")){
				whiteCanCastle = false;
			}else if(draggedPiece.classList.contains("bk") || draggedPiece.classList.contains("br")){
				blackCanCastle = false;
			}
			removeHints();
			droppedOnSquare.remove();
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
	}else if(r==8&&c==1 || r==8&&c==8){
		startPiece.classList.add("piece");
		startPiece.classList.add("br");
		startPiece.classList.add("black");
		startPiece.src = "./pieceImages/br.png";
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
		if(locY == 2){
			hint(document.querySelector(`[row="${locY+1}"][column="${locX}"]`));
			hint(document.querySelector(`[row="${locY+2}"][column="${locX}"]`));
		}else{
			hint(document.querySelector(`[row="${locY+1}"][column="${locX}"]`));
		}
	}else if(pieceElement.classList.contains("bp")){
		if(locY == 7){
			hint(document.querySelector(`[row="${locY-1}"][column="${locX}"]`));
			hint(document.querySelector(`[row="${locY-2}"][column="${locX}"]`));
		}else{
			hint(document.querySelector(`[row="${locY-1}"][column="${locX}"]`));
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
		potentialHintSquares.forEach(square => {
			if (square) {
				hint(square);
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


allowPieceMovement();
