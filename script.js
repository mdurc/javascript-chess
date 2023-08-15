const board = document.querySelector(".board");
let addPieceClass = true;

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

function pieceSetup(square, r, c) {
	if(r==2){
		square.classList.add("wp");
		addPieceClass = true;
	}else if(r == 7){
		square.classList.add("bp");
	}else if(r==1&&c==1){
		square.classList.add("wr");
	}else if(r==1&&c==2){
		square.classList.add("wn");
	}else if(r==1&&c==3){
		square.classList.add("wb");
	}else if(r==1&&c==4){
		square.classList.add("wq");
	}else if(r==1&&c==5){
		square.classList.add("wk");
	}else if(r==1&&c==6){
		square.classList.add("wb");
	}else if(r==1&&c==7){
		square.classList.add("wn");
	}else if(r==1&&c==8){
		square.classList.add("wr");
	}else if(r==8&&c==1){
		square.classList.add("br");
	}else if(r==8&&c==2){
		square.classList.add("bn");
	}else if(r==8&&c==3){
		square.classList.add("bb");
	}else if(r==8&&c==4){
		square.classList.add("bq");
	}else if(r==8&&c==5){
		square.classList.add("bk");
	}else if(r==8&&c==6){
		square.classList.add("bb");
	}else if(r==8&&c==7){
		square.classList.add("bn");
	}else if(r==8&&c==8){
		square.classList.add("br");
	}else{
		addPieceClass = false;
	}

	if(addPieceClass){
		square.classList.add("piece");
		addPieceClass = true;
	}
}
