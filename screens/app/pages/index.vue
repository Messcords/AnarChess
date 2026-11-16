<script setup lang="ts">
import type { Square } from '~/utils/chess'
import { initialPieces, movePiece, type Piece } from '~/utils/pieces'

const pieces = ref<Piece[]>(initialPieces())

function onMove(from: Square, to: Square) {
  pieces.value = movePiece(pieces.value, from, to)
}

function reset() {
  pieces.value = initialPieces()
}
</script>

<template>
  <main class="home">
    <h1>AnarChess</h1>
    <DisplayBoard :pieces="pieces" @move="onMove" />
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
