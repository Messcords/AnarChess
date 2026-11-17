<script setup lang="ts">
import type { Square } from '~/utils/chess'
import { initialBoard, type BoardMatrix, type Color } from '~/utils/pieces'
import { playMove, type Move, type PromotionPiece } from '~/utils/rules'

const board = ref<BoardMatrix>(initialBoard())
const history = ref<Move[]>([])
const turn = ref<Color>('white')

const turnLabel = computed(() => {
  if (turn.value === 'white') {
    return 'Au tour des blancs'
  }
  return 'Au tour des noirs'
})

function onMove(from: Square, to: Square, promotion?: PromotionPiece) {
  board.value = playMove(board.value, from, to, promotion)

  const move: Move = { from, to }
  history.value = [...history.value, move]

  if (turn.value === 'white') {
    turn.value = 'black'
  } else {
    turn.value = 'white'
  }
}

function reset() {
  board.value = initialBoard()
  history.value = []
  turn.value = 'white'
}
</script>

<template>
  <main class="home">
    <h1>AnarChess</h1>
    <p class="turn" data-testid="turn" aria-live="polite">{{ turnLabel }}</p>
    <DisplayBoard :board="board" :history="history" :turn="turn" @move="onMove" />
    <button type="button" class="reset" data-testid="reset" @click="reset">Réinitialiser</button>
  </main>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  font-family: system-ui, sans-serif;
}

.turn {
  margin: 0;
  font-weight: 600;
  color: #6b4f36;
}

.reset {
  padding: 0.5rem 1.25rem;
  font: inherit;
  border: 1px solid #6b4f36;
  border-radius: 0.375rem;
  background: #fff;
  color: #6b4f36;
  cursor: pointer;
}

.reset:hover {
  background: #f0d9b5;
}
</style>
