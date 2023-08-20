# javascript-chess


[Demo Link](https://mdurc.github.io/javascript-chess) 

<ul>
  <li>Fully functional chess game. Defualtly 2 person game (User controls both sides. Turn is displayed above the board).</li>
  <li>Shows a move history list on the left, updating dynamically</li>
  <li>When a piece is clicked, the only possible move squares for the piece are highlighted with a circle hint</li>
  <ul>
    <li>If a king is in check, the player is only allowed to make moves that get them out of check</li>
  </ul>
  <li>Supports drag and drop play or press and click to move</li>
  <li>All chess rules are implemented, the major ones:</li>
  <ul>
    <li>Basic piece movements</li>
    <li>En Passant</li>
    <li>Promotion</li>
    <li>Checks(discovery, multiple checks), pins</li>
    <li>Checkmate, Stalemate</li>
    <li>Castling rights</li>
    <ul>
      <li>Searches for if either the king or rook have moved, or if the squares the king would move to or over, are attacked</li>
    </ul>
  </ul>
</ul>

#### Buttons implemented
<ul>
  <li>Play a random computer move, which can be continuously pressed and used for either side.</li>
  <li>Flip board</li>
  <li>Toggle Hints</li>
  <li>Copy PGN (converts the move history into proper pgn long move format, which can be used for analysis on chess.com)</li>
  <ul>Uses long move format to avoid errors with move ambiguities (when two pieces could be moved to the location ex. Rb1, but there are two possible rooks able to go to b1, so we format it with Ra1b1, rook from a1 to b1)</ul>
</ul>
