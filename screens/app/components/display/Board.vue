<script setup lang="ts">
import { FILES, RANKS, boardSquares, isLightSquare } from '~/utils/chess'

const squares = boardSquares()
</script>

<template>
  <div class="board">
    <div class="ranks">
      <span v-for="rank in RANKS" :key="rank" class="coord-rank">{{ rank }}</span>
    </div>

    <div class="grid">
      <button
        v-for="square in squares"
        :key="square"
        type="button"
        class="square"
        :class="isLightSquare(square) ? 'light' : 'dark'"
        :data-square="square"
        :aria-label="square"
      />
    </div>

    <div class="files">
      <span v-for="file in FILES" :key="file" class="coord-file">{{ file }}</span>
    </div>
  </div>
</template>

<style scoped>
.board {
  --size: min(90vw, 560px);
  --light: #f0d9b5;
  --dark: #b58863;

  display: grid;
  grid-template-columns: auto var(--size);
  grid-template-areas:
    'ranks grid'
    '.     files';
  gap: 0.25rem;
  font-family: system-ui, sans-serif;
  color: #555;
}

.ranks {
  grid-area: ranks;
  display: grid;
  grid-template-rows: repeat(8, 1fr);
  align-items: center;
}

.files {
  grid-area: files;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  text-align: center;
}

.grid {
  grid-area: grid;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  width: var(--size);
  border: 2px solid #6b4f36;
}

.square {
  aspect-ratio: 1;
  border: 0;
  padding: 0;
}

.light {
  background: var(--light);
}

.dark {
  background: var(--dark);
}
</style>
