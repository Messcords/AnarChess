<script setup lang="ts">
import { FILES, RANKS, boardSquares, isLightSquare, type Square } from '~/utils/chess'
import {
  cellAt,
  pieceColor,
  pieceGlyph,
  type BoardMatrix,
  type Color,
  type PieceCode,
} from '~/utils/pieces'
import {
  PROMOTION_PIECES,
  isPromotion,
  legalMoves,
  promotedPiece,
  type Move,
  type PromotionPiece,
} from '~/utils/rules'

const PROMOTION_LABELS: Record<PromotionPiece, string> = {
  Q: 'Dame',
  R: 'Tour',
  B: 'Fou',
  N: 'Cavalier',
}

type Props = {
  // The API contract board: 8×8 matrix of piece codes ('' = empty square).
  board?: BoardMatrix
  // Moves already played, needed to know if castling is still allowed.
  history?: Move[]
  // The side to move: only its pieces can be picked.
  turn?: Color
}

const props = withDefaults(defineProps<Props>(), {
  board: () => [],
  history: () => [],
  turn: 'white',
})

const emit = defineEmits<{
  move: [from: Square, to: Square, promotion?: PromotionPiece]
}>()

const selected = ref<Square | null>(null)

// A pawn move waiting for the player to choose the new piece.
const pendingPromotion = ref<Move | null>(null)

// A new position (move applied, reset…) invalidates any pending selection.
watch(
  () => props.board,
  () => {
    selected.value = null
    pendingPromotion.value = null
  },
)

const promotionChoices = computed(() => {
  const move = pendingPromotion.value
  if (move === null) {
    return []
  }

  const pawn = cellAt(props.board, move.from) as PieceCode
  return PROMOTION_PIECES.map((choice) => {
    const newPiece = promotedPiece(pawn, choice)
    return {
      choice,
      glyph: pieceGlyph(newPiece),
      label: PROMOTION_LABELS[choice],
    }
  })
})

const targets = computed(() => {
  if (selected.value === null) {
    return []
  }
  return legalMoves(props.board, selected.value, props.history)
})

const cells = computed(() =>
  boardSquares().map((square) => ({
    square,
    light: isLightSquare(square),
    code: cellAt(props.board, square),
    target: targets.value.includes(square),
  })),
)

function canSelect(square: Square, from: Square | null): boolean {
  const piece = cellAt(props.board, square)
  if (piece === '' || square === from) {
    return false
  }
  return pieceColor(piece) === props.turn
}

/**
 * Two-click move. The first click picks a piece. The second click plays
 * the move if the square is a legal target, picks another piece of the
 * side to move, or cancels the selection. A pawn reaching the last rank
 * first opens the promotion choice. The parent applies the move.
 */
function onSquareClick(square: Square) {
  if (pendingPromotion.value !== null) {
    cancelPromotion()
    return
  }

  const from = selected.value
  const isLegalTarget = targets.value.includes(square)

  if (from !== null && isLegalTarget) {
    selected.value = null
    if (isPromotion(props.board, from, square)) {
      pendingPromotion.value = { from, to: square }
      return
    }
    emit('move', from, square)
    return
  }

  if (canSelect(square, from)) {
    selected.value = square
  } else {
    selected.value = null
  }
}

function choosePromotion(choice: PromotionPiece) {
  const move = pendingPromotion.value
  if (move === null) {
    return
  }
  pendingPromotion.value = null
  emit('move', move.from, move.to, choice)
}

function cancelPromotion() {
  pendingPromotion.value = null
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

      <div v-if="pendingPromotion" class="promotion" role="dialog" aria-label="Choisir la pièce de promotion">
        <p class="promotion-title">Promotion</p>
        <div class="promotion-choices">
          <button
            v-for="{ choice, glyph, label } in promotionChoices"
            :key="choice"
            type="button"
            class="promotion-choice"
            :data-promotion="choice"
            :aria-label="label"
            @click="choosePromotion(choice)"
          >
            {{ glyph }}
          </button>
        </div>
        <button type="button" class="promotion-cancel" data-testid="promotion-cancel" @click="cancelPromotion">
          Annuler
        </button>
      </div>
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
  position: relative;
}

/* Promotion choice: a panel over the board. */
.promotion {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: rgb(0 0 0 / 45%);
}

.promotion-title {
  margin: 0;
  color: #fff;
  font-weight: 600;
}

.promotion-choices {
  display: flex;
  gap: 0.5rem;
}

.promotion-choice {
  width: calc(var(--size) / 8);
  aspect-ratio: 1;
  border: 2px solid #6b4f36;
  border-radius: 0.375rem;
  background: var(--light);
  font-size: calc(var(--size) / 8 * 0.6);
  font-variant-emoji: text;
  cursor: pointer;
}

.promotion-cancel {
  padding: 0.25rem 1rem;
  border: 1px solid #fff;
  border-radius: 0.375rem;
  background: transparent;
  color: #fff;
  cursor: pointer;
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
