<script setup lang="ts">
import { FILES, RANKS, boardSquares, isLightSquare, type Square } from '~/utils/chess'
import { cellAt, pieceGlyph, type BoardMatrix } from '~/utils/pieces'

/** `board` follows the API contract: 8×8 matrix of piece codes ('' = empty). */
const props = withDefaults(defineProps<{ board?: BoardMatrix }>(), { board: () => [] })
const emit = defineEmits<{ move: [from: Square, to: Square] }>()

const selected = ref<Square | null>(null)

// A new position (move applied, reset…) invalidates any pending selection.
watch(
  () => props.board,
  () => {
    selected.value = null
  },
)
const cells = computed(() =>
  boardSquares().map((square) => ({
    square,
    light: isLightSquare(square),
    code: cellAt(props.board, square),
  })),
)

/** Two-click move: pick a piece, then its destination. The parent applies the move. */
function onSquareClick(square: Square) {
  if (selected.value === null) {
    if (cellAt(props.board, square) !== '') selected.value = square
    return
  }
  if (selected.value !== square) emit('move', selected.value, square)
  selected.value = null
}
</script>

<template>
  <div class="board">
    <div class="ranks">
      <span v-for="rank in RANKS" :key="rank" class="coord-rank">{{ rank }}</span>
    </div>

    <div class="grid">
      <button
        v-for="{ square, light, code } in cells"
        :key="square"
        type="button"
        class="square"
        :class="[light ? 'light' : 'dark', { selected: selected === square }]"
        :data-square="square"
        :aria-label="square"
        :aria-pressed="selected === square"
        @click="onSquareClick(square)"
      >
        <span v-if="code" class="piece" :data-piece="code">{{ pieceGlyph(code) }}</span>
      </button>
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
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.piece {
  font-size: calc(var(--size) / 8 * 0.7);
  line-height: 1;
  color: #111;
  font-variant-emoji: text;
  user-select: none;
}

.selected {
  box-shadow: inset 0 0 0 4px #f6c90e;
}

.light {
  background: var(--light);
}

.dark {
  background: var(--dark);
}
</style>
