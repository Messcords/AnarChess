<script setup lang="ts">
import { ApiError } from '~/utils/apiError'
import {
  createBoard,
  getBoardState,
  joinBoard,
  resetBoard as resetRemoteBoard,
  updateBoardState,
  type BoardState,
  type BoardStateUpdate,
  type PlayerAccess,
} from '~/utils/apiClient'
import type { Square } from '~/utils/chess'
import { initialBoard, movePiece, type BoardMatrix } from '~/utils/pieces'

const board = ref<BoardMatrix>(initialBoard())
const boardState = ref<BoardState | null>(null)
const access = ref<PlayerAccess | null>(null)
const boardId = ref('')
const errorMessage = ref('')
const busy = ref(false)
const refreshing = ref(false)
const apiBase = String(useRuntimeConfig().public.apiBase)
const route = useRoute()
const router = useRouter()
const STORAGE_KEY = 'anarchess.playerAccess'

let refreshTimer: ReturnType<typeof setInterval> | undefined

function applyBoardState(state: BoardState) {
  boardState.value = state
  board.value = state.board
}

function errorText(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Une erreur inattendue est survenue.'
}

function isPlayerAccess(value: unknown): value is PlayerAccess {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.boardId === 'string'
    && typeof candidate.playerId === 'string'
    && typeof candidate.token === 'string'
    && (candidate.role === 'white' || candidate.role === 'black')
}

function saveAccess(playerAccess: PlayerAccess) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playerAccess))
}

async function activateGame(playerAccess: PlayerAccess) {
  access.value = playerAccess
  boardId.value = playerAccess.boardId
  saveAccess(playerAccess)
  applyBoardState(await getBoardState(apiBase, playerAccess.boardId))
  await router.replace({ query: { ...route.query, board: playerAccess.boardId } })
}

async function handleCreate() {
  busy.value = true
  errorMessage.value = ''
  try {
    const playerAccess = await createBoard(apiBase)
    await activateGame(playerAccess)
  } catch (error) {
    errorMessage.value = errorText(error)
  } finally {
    busy.value = false
  }
}

async function handleJoin() {
  if (!boardId.value.trim()) {
    errorMessage.value = 'Saisissez l’identifiant de la partie.'
    return
  }

  busy.value = true
  errorMessage.value = ''
  try {
    const playerAccess = await joinBoard(apiBase, boardId.value.trim())
    await activateGame(playerAccess)
  } catch (error) {
    errorMessage.value = errorText(error)
  } finally {
    busy.value = false
  }
}

async function refreshBoard() {
  if (!access.value || busy.value || refreshing.value) return
  refreshing.value = true
  try {
    applyBoardState(await getBoardState(apiBase, access.value.boardId))
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = errorText(error)
  } finally {
    refreshing.value = false
  }
}

async function onMove(from: Square, to: Square) {
  if (!access.value || !boardState.value) {
    board.value = movePiece(board.value, from, to)
    return
  }

  const nextBoard = movePiece(board.value, from, to)
  const state = boardState.value.gameState
  const update: BoardStateUpdate = {
    gameState: {
      status: state.status,
      turn: state.turn === 'white' ? 'black' : 'white',
      ruleSet: state.ruleSet,
      outcome: state.outcome,
    },
    board: nextBoard,
  }
  busy.value = true
  errorMessage.value = ''
  try {
    applyBoardState(await updateBoardState(apiBase, access.value, update))
  } catch (error) {
    errorMessage.value = errorText(error)
    try {
      applyBoardState(await getBoardState(apiBase, access.value.boardId))
    } catch (refreshError) {
      errorMessage.value = `${errorMessage.value} ${errorText(refreshError)}`
    }
  } finally {
    busy.value = false
  }
}

async function reset() {
  if (access.value) {
    busy.value = true
    errorMessage.value = ''
    try {
      applyBoardState(await resetRemoteBoard(apiBase, access.value))
    } catch (error) {
      errorMessage.value = errorText(error)
    } finally {
      busy.value = false
    }
    return
  }
  board.value = initialBoard()
}

onMounted(() => {
  refreshTimer = setInterval(() => void refreshBoard(), 2000)
  const queryBoardId = route.query.board
  boardId.value = typeof queryBoardId === 'string' ? queryBoardId : ''
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    const playerAccess: unknown = JSON.parse(saved)
    if (!isPlayerAccess(playerAccess)) {
      throw new Error('La session enregistrée est invalide.')
    }
    if (boardId.value && boardId.value !== playerAccess.boardId) return
    busy.value = true
    void activateGame(playerAccess)
      .catch((error: unknown) => {
        errorMessage.value = errorText(error)
      })
      .finally(() => {
        busy.value = false
      })
  } catch (error) {
    errorMessage.value = errorText(error)
  }
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <main class="home">
    <h1>AnarChess</h1>
    <section class="game-controls" aria-label="Gestion de la partie">
      <button type="button" :disabled="busy" data-testid="create-game" @click="handleCreate">
        Créer une partie
      </button>
      <form @submit.prevent="handleJoin">
        <label for="board-id">Identifiant de la partie</label>
        <input id="board-id" v-model="boardId" autocomplete="off">
        <button type="submit" :disabled="busy">Rejoindre</button>
      </form>
      <p v-if="access" role="status">
        Partie {{ access.boardId }} — vous jouez
        {{ access.role === 'white' ? 'les blancs' : 'les noirs' }}.
        {{ boardState?.gameState.status === 'waiting' ? 'En attente d’un adversaire.' : '' }}
      </p>
      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>
    <DisplayBoard :board="board" @move="onMove" />
    <button type="button" class="reset" data-testid="reset" :disabled="busy" @click="reset">
      Réinitialiser
    </button>
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

.game-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.game-controls form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.game-controls input {
  min-width: 16rem;
  padding: 0.5rem;
  font: inherit;
}

.error {
  color: #b42318;
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

button:disabled {
  cursor: wait;
  opacity: 0.7;
}
</style>
