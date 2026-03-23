import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Question from '#models/question'

export default class extends BaseSeeder {
  async run() {
    await Question.createMany([
      {
        questionText: 'What is the maximum number of moves in a 3x3 Tic-Tac-Toe game?',
        options: JSON.stringify(['7', '8', '9', '10']),
        correctAnswerIndex: 2,
      },
      {
        questionText: 'How many winning combinations are there in Tic-Tac-Toe?',
        options: JSON.stringify(['6', '8', '10', '12']),
        correctAnswerIndex: 1,
      },
      {
        questionText: 'Which symbol usually goes first in a standard game?',
        options: JSON.stringify(['X', 'O', 'Random', 'Both']),
        correctAnswerIndex: 0,
      },
      {
        questionText: 'Is it possible to win Tic-Tac-Toe in 3 moves?',
        options: JSON.stringify(['Yes', 'No', 'Only if O starts', 'Depends on rules']),
        correctAnswerIndex: 0,
      },
      {
        questionText: 'A game of Tic-Tac-Toe that ends in a draw is also called a:',
        options: JSON.stringify(['Boring game', "Cat's game", 'Deadlock', 'Tie-breaker']),
        correctAnswerIndex: 1,
      },
    ])
  }
}
