<script setup lang="ts">
import { FILES, RANKS, boardSquares, isLightSquare, type Square } from '~/utils/chess'
import { cellAt, pieceColor, pieceGlyph, type BoardMatrix } from '~/utils/pieces'
import { legalMoves } from '~/utils/rules'

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
// Squares where the selected piece is allowed to go.
const targets = computed(() => {
  if (selected.value === null) {
    return []
  }
  return legalMoves(props.board, selected.value)
})

const cells = computed(() =>
  boardSquares().map((square) => ({
    square,
    light: isLightSquare(square),
    code: cellAt(props.board, square),
    target: targets.value.includes(square),
  })),
)

// A piece can be picked when nothing is selected yet,
// or when it has the same color as the selected piece.
function canSelect(square: Square, from: Square | null): boolean {
  const piece = cellAt(props.board, square)
  if (piece === '' || square === from) {
    return false
  }
  if (from === null) {
    return true
  }
  const selectedPiece = cellAt(props.board, from)
  return selectedPiece !== '' && pieceColor(piece) === pieceColor(selectedPiece)
}

/**
 * Two-click move. The first click picks a piece. The second click plays
 * the move if the square is a legal target, picks another piece of the
 * same color, or cancels the selection. The parent applies the move.
 */
function onSquareClick(square: Square) {
  const from = selected.value
  if (from !== null && targets.value.includes(square)) {
    emit('move', from, square)
    selected.value = null
    return
  }
  selected.value = canSelect(square, from) ? square : null
}
</script>

<template>
  <div class="board">
    <div class="ranks">
      <span v-for="rank in RANKS" :key="rank" class="coord-rank">{{ rank }}</span>
    </div>

    <div class="grid">
      <button
        v-for="{ square, light, code, target } in cells"
        :key="square"
        type="button"
        class="square"
        :class="[
          light ? 'light' : 'dark',
          {
            selected: selected === square,
            target: target && code === '',
            capture: target && code !== '',
          },
        ]"
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

/* Empty square the selected piece can go to: a dot in the middle. */
.target::after {
  content: '';
  width: 28%;
  height: 28%;
  border-radius: 50%;
  background: rgb(0 0 0 / 25%);
}

/* Enemy piece the selected piece can capture: a ring around the square. */
.capture {
  box-shadow: inset 0 0 0 4px rgb(0 0 0 / 35%);
}

.light {
  background: var(--light);
}

.dark {
  background: var(--dark);
}
</style>
