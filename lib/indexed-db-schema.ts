export const DB_NAME = "flashGeniusDB"
export const DB_VERSION = 2

export const STORES = {
  CARD_SETS: "cardSets",
  TAGS: "tags",
  CARD_PROGRESS: "cardProgress",
  STUDY_SESSIONS: "studySessions",
  USER_SETTINGS: "userSettings",
}

export interface DBSchema {
  cardSets: {
    key: string
    indexes: {
      name: string
      theme: string
      tags: string[]
      createdAt: Date
      updatedAt: Date
    }
  }
  tags: {
    key: string
    indexes: {
      name: string
    }
  }
  cardProgress: {
    key: string
    indexes: {
      cardId: string
      cardSetId: string
      status: string
      lastReviewedAt: Date
      nextReviewAt: Date
    }
  }
  studySessions: {
    key: string
    indexes: {
      cardSetId: string
      startedAt: Date
      completedAt: Date
    }
  }
  userSettings: {
    key: string
  }
}

export const createObjectStores = (db: IDBDatabase): void => {
  // カードセットストアの作成
  if (!db.objectStoreNames.contains(STORES.CARD_SETS)) {
    const cardSetsStore = db.createObjectStore(STORES.CARD_SETS, { keyPath: "id" })
    cardSetsStore.createIndex("name", "name", { unique: false })
    cardSetsStore.createIndex("theme", "theme", { unique: false })
    cardSetsStore.createIndex("tags", "tags", { unique: false, multiEntry: true })
    cardSetsStore.createIndex("createdAt", "createdAt", { unique: false })
    cardSetsStore.createIndex("updatedAt", "updatedAt", { unique: false })
  }

  // タグストアの作成
  if (!db.objectStoreNames.contains(STORES.TAGS)) {
    const tagsStore = db.createObjectStore(STORES.TAGS, { keyPath: "id" })
    tagsStore.createIndex("name", "name", { unique: true })
  }

  // カード進捗ストアの作成
  if (!db.objectStoreNames.contains(STORES.CARD_PROGRESS)) {
    const progressStore = db.createObjectStore(STORES.CARD_PROGRESS, { keyPath: "id" })
    progressStore.createIndex("cardId", "cardId", { unique: false })
    progressStore.createIndex("cardSetId", "cardSetId", { unique: false })
    progressStore.createIndex("status", "status", { unique: false })
    progressStore.createIndex("lastReviewedAt", "lastReviewedAt", { unique: false })
    progressStore.createIndex("nextReviewAt", "nextReviewAt", { unique: false })
  }

  // 学習セッションストアの作成
  if (!db.objectStoreNames.contains(STORES.STUDY_SESSIONS)) {
    const sessionsStore = db.createObjectStore(STORES.STUDY_SESSIONS, { keyPath: "id" })
    sessionsStore.createIndex("cardSetId", "cardSetId", { unique: false })
    sessionsStore.createIndex("startedAt", "startedAt", { unique: false })
    sessionsStore.createIndex("completedAt", "completedAt", { unique: false })
  }

  // ユーザー設定ストアの作成
  if (!db.objectStoreNames.contains(STORES.USER_SETTINGS)) {
    db.createObjectStore(STORES.USER_SETTINGS, { keyPath: "id" })
  }
}
