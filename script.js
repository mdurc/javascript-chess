const board = document.querySelector(".board");
let isBlank = false;

let draggedPiece = null;

boardSetup();

let pieces = document.querySelectorAll(".piece");

let isDragging = false;

pieces.forEach(piece => {
	piece.addEventListener('mousedown', (event) => {
        if (!isDragging) {
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

    });
	function movePiece(event) {
		if (isDragging && draggedPiece) {
			document.style.cursor = "grabbing";
			draggedPiece.style.left = (event.clientX - draggedPiece.offsetWidth / 2) + 'px';
			draggedPiece.style.top = (event.clientY - draggedPiece.offsetHeight / 2) + 'px';
        }
    }
});

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
		isDragging = false;

        //Determine the square element based on mouse location
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const emptySquares = document.querySelectorAll('.square.empty');
		let droppedOnSquare = null;

		emptySquares.forEach(square => {
			const squareRect = square.getBoundingClientRect();
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
			const squareRect = droppedOnSquare.getBoundingClientRect();
			const pieceWidth = draggedPiece.offsetWidth;
			const pieceHeight = draggedPiece.offsetHeight;

			const centerX = squareRect.left + (squareRect.width - pieceWidth) / 2;
			const centerY = squareRect.top + (squareRect.height - pieceHeight) / 2;

			draggedPiece.style.left = centerX + 'px';
			draggedPiece.style.top = centerY + 'px';

			draggedPiece.parentNode.appendChild(newEmpty());
			droppedOnSquare.parentNode.appendChild(draggedPiece);
			droppedOnSquare.remove();
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
		startPiece.src ="./pieceImages/wp.png";
		isBlank = false;
	}else if(r == 7){
		startPiece.classList.add("piece");
		startPiece.classList.add("bp");
		startPiece.src = "./pieceImages/bp.png";
	}else if(r==1&&c==1 || r==1&&c==8){
		startPiece.classList.add("piece");
		startPiece.classList.add("wr");
		startPiece.src = "./pieceImages/wr.png";
	}else if(r==1&&c==2 || r==1&&c==7){
		startPiece.classList.add("piece");
		startPiece.classList.add("wn");
		startPiece.src = "./pieceImages/wn.png";
	}else if(r==1&&c==3 || r==1&&c==6){
		startPiece.classList.add("piece");
		startPiece.classList.add("wb");
		startPiece.src = "./pieceImages/wb.png";
	}else if(r==1&&c==4){
		startPiece.classList.add("piece");
		startPiece.classList.add("wq");
		startPiece.src = "./pieceImages/wq.png";
	}else if(r==1&&c==5){
		startPiece.classList.add("piece");
		startPiece.classList.add("wk");
		startPiece.src = "./pieceImages/wk.png";
	}else if(r==8&&c==1 || r==8&&c==8){
		startPiece.classList.add("piece");
		startPiece.classList.add("br");
		startPiece.src = "./pieceImages/br.png";
	}else if(r==8&&c==2 || r==8&&c==7){
		startPiece.classList.add("piece");
		startPiece.classList.add("bn");
		startPiece.src = "./pieceImages/bn.png";
	}else if(r==8&&c==3 || r==8&&c==6){
		startPiece.classList.add("piece");
		startPiece.classList.add("bb");
		startPiece.src = "./pieceImages/bb.png";
	}else if(r==8&&c==4){
		startPiece.classList.add("piece");
		startPiece.classList.add("bq");
		startPiece.src = "./pieceImages/bq.png";
	}else if(r==8&&c==5){
		startPiece.classList.add("piece");
		startPiece.classList.add("bk");
		startPiece.src = "./pieceImages/bk.png";
	}else{
		isBlank = true;
		let blank = document.createElement("div");
		blank.classList.add("square");
		blank.classList.add("empty");
		square.appendChild(blank);
	}
	if(!isBlank){
		square.appendChild(startPiece);
		isBlank = false;
	}
}


function newEmpty() {
	let blank = document.createElement("div");
	blank.classList.add("square");
	blank.classList.add("empty");
	return blank;
}
