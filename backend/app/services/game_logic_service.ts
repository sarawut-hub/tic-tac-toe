export default class GameLogicService {
  /**
   * Calculate the winner of a Tic-Tac-Toe game
   * Returns 'X', 'O', 'DRAW', or null
   */
  public static calculateWinner(board: (string | null)[]): string | null {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ]

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }

    if (board.every((cell) => cell !== null)) {
      return 'DRAW'
    }

    return null
  }

  /**
   * Make a move for the bot
   */
  public static makeBotMove(board: (string | null)[], difficulty: number = 1): number {
    const emptyCells = board
      .map((cell, index) => (cell === null ? index : null))
      .filter((cell) => cell !== null) as number[]

    if (emptyCells.length === 0) return -1

    // Difficulty 1: Random move
    if (difficulty === 1) {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)]
    }

    // Difficulty 2+: Try to win or block
    // 1. Try to win
    for (const cell of emptyCells) {
      const tempBoard = [...board]
      tempBoard[cell] = 'O'
      if (this.calculateWinner(tempBoard) === 'O') return cell
    }

    // 2. Try to block user
    for (const cell of emptyCells) {
      const tempBoard = [...board]
      tempBoard[cell] = 'X'
      if (this.calculateWinner(tempBoard) === 'X') return cell
    }

    // 3. Take center if available
    if (emptyCells.includes(4)) return 4

    // 4. Random move
    return emptyCells[Math.floor(Math.random() * emptyCells.length)]
  }
}
