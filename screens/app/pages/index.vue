<script setup lang="ts">
import type { Square } from '~/utils/chess'
import { initialBoard, type BoardMatrix } from '~/utils/pieces'
import { playMove, type Move } from '~/utils/rules'

const board = ref<BoardMatrix>(initialBoard())
const history = ref<Move[]>([])

function onMove(from: Square, to: Square) {
  board.value = playMove(board.value, from, to)

  const move: Move = { from, to }
  history.value = [...history.value, move]
}

function reset() {
  board.value = initialBoard()
  history.value = []
}
</script>

<template>
  <main class="home">
    <h1>AnarChess</h1>
    <DisplayBoard :board="board" :history="history" @move="onMove" />
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
