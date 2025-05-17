import type { CardSet, Tag } from "@/types"
import type { CardProgress, StudySession, LearningStats } from "@/types/progress"
import { DB_NAME, DB_VERSION, STORES, createObjectStores } from "./indexed-db-schema"
import { generateId } from "./utils"

// データベース接続を開く
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is not available on the server"))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (_event) => { // ESLint修正: event -> _event
      reject(new Error("Failed to open database"))
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      createObjectStores(db)
    }
  })
}

// トランザクションを実行
// ESLint修正: any -> T, callbackの返り値の型を IDBRequest<T> に変更
const runTransaction = <T = any>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase()
      const transaction = db.transaction(storeName, mode)
      const store = transaction.objectStore(storeName)

      const request = callback(store)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error("Transaction failed"))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    } catch (error: unknown) { // ESLint修正: any -> unknown
      reject(error)
    }
  })
}

// カードセットの取得
export const getAllCardSets = (): Promise<CardSet[]> => {
  return runTransaction<CardSet[]>(STORES.CARD_SETS, "readonly", (store) => { // ESLint修正: 型引数指定, as Promise<CardSet[]> 削除
    return store.getAll()
  })
}

// タグの取得
export const getAllTags = (): Promise<Tag[]> => {
  return runTransaction<Tag[]>(STORES.TAGS, "readonly", (store) => { // ESLint修正: 型引数指定, as Promise<Tag[]> 削除
    return store.getAll()
  })
}

// テーマの取得
export const getAvailableThemes = async (): Promise<string[]> => {
  const cardSets = await getAllCardSets()
  const themes = [...new Set(cardSets.map((set) => set.theme).filter(Boolean))] as string[]
  return themes
}

// カードセットの追加
export const addCardSet = async (cardSet: Omit<CardSet, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const id = generateId()
  const now = new Date()

  // タグの処理
  if (cardSet.tags) {
    for (const tagName of cardSet.tags) {
      try {
        await getTagByName(tagName)
      } catch (_error) { // ESLint修正: error -> _error
        // タグが存在しない場合は追加
        const tagId = generateId()
        await addTag({ id: tagId, name: tagName })
      }
    }
  }

  // カードセットの追加
  await runTransaction(STORES.CARD_SETS, "readwrite", (store) => {
    return store.add({
      ...cardSet,
      id,
      createdAt: now,
      updatedAt: now,
    })
  })

  // 各カードの進捗情報を初期化
  for (const card of cardSet.cards) {
    await addCardProgress({
      cardId: card.id,
      cardSetId: id,
      status: "new",
      correctCount: 0,
      incorrectCount: 0,
      lastReviewedAt: null,
      nextReviewAt: null,
      easeFactor: 2.5, // デフォルト値
      interval: 1, // デフォルト値（日数）
    })
  }

  return id
}

// タグの追加
export const addTag = (tag: Tag): Promise<IDBValidKey> => {
  return runTransaction<IDBValidKey>(STORES.TAGS, "readwrite", (store) => { // ESLint修正: 型引数指定
    return store.add(tag)
  })
}

// タグ名による取得
export const getTagByName = (name: string): Promise<Tag> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase()
      const transaction = db.transaction(STORES.TAGS, "readonly")
      const store = transaction.objectStore(STORES.TAGS)
      const index = store.index("name")
      const request = index.get(name)

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result)
        } else {
          reject(new Error(`Tag with name ${name} not found`))
        }
      }

      request.onerror = () => {
        reject(new Error("Failed to get tag by name"))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    } catch (error: unknown) { // ESLint修正: any -> unknown
      reject(error)
    }
  })
}

// カードセットの取得（ID指定）
export const getCardSetById = (id: string): Promise<CardSet | undefined> => {
  return runTransaction<CardSet | undefined>(STORES.CARD_SETS, "readonly", (store) => { // ESLint修正: 型引数指定, as Promise<CardSet | undefined> 削除
    return store.get(id)
  })
}

// カードセットの更新
export const updateCardSet = async (
  id: string,
  updates: Partial<Omit<CardSet, "id" | "createdAt" | "updatedAt">>,
): Promise<void> => {
  // 現在のカードセットを取得
  const currentCardSet = await getCardSetById(id)
  if (!currentCardSet) {
    throw new Error(`Card set with id ${id} not found`)
  }

  // タグの処理
  if (updates.tags) {
    for (const tagName of updates.tags) {
      try {
        await getTagByName(tagName)
      } catch (_error) { // ESLint修正: error -> _error
        // タグが存在しない場合は追加
        const tagId = generateId()
        await addTag({ id: tagId, name: tagName })
      }
    }
  }

  // カードセットの更新
  await runTransaction(STORES.CARD_SETS, "readwrite", (store) => {
    return store.put({
      ...currentCardSet,
      ...updates,
      id,
      updatedAt: new Date(),
    })
  })

  // 新しいカードが追加された場合、それらの進捗情報を初期化
  if (updates.cards) {
    const existingCardIds = currentCardSet.cards.map((card) => card.id)
    const newCards = updates.cards.filter((card) => !existingCardIds.includes(card.id))

    for (const card of newCards) {
      await addCardProgress({
        cardId: card.id,
        cardSetId: id,
        status: "new",
        correctCount: 0,
        incorrectCount: 0,
        lastReviewedAt: null,
        nextReviewAt: null,
        easeFactor: 2.5,
        interval: 1,
      })
    }
  }
}

// カードセットの削除
export const deleteCardSet = async (id: string): Promise<void> => {
  // カードセットを削除
  await runTransaction(STORES.CARD_SETS, "readwrite", (store) => {
    return store.delete(id)
  })

  // 関連するカード進捗情報を削除
  const allProgress = await getAllCardProgress()
  const relatedProgress = allProgress.filter((progress) => progress.cardSetId === id)

  for (const progress of relatedProgress) {
    await deleteCardProgress(progress.id)
  }

  // 関連する学習セッションを削除
  const allSessions = await getAllStudySessions()
  const relatedSessions = allSessions.filter((session) => session.cardSetId === id)

  for (const session of relatedSessions) {
    await deleteStudySession(session.id)
  }
}

// カード進捗の追加
export const addCardProgress = async (progress: Omit<CardProgress, "id">): Promise<string> => {
  const id = generateId()

  await runTransaction(STORES.CARD_PROGRESS, "readwrite", (store) => {
    return store.add({
      ...progress,
      id,
    })
  })

  return id
}

// カード進捗の取得（全て）
export const getAllCardProgress = (): Promise<CardProgress[]> => {
  return runTransaction<CardProgress[]>(STORES.CARD_PROGRESS, "readonly", (store) => { // ESLint修正: 型引数指定, as Promise<CardProgress[]> 削除
    return store.getAll()
  })
}

// カード進捗の取得（カードID指定）
export const getCardProgressByCardId = async (cardId: string): Promise<CardProgress | undefined> => {
  const allProgress = await getAllCardProgress()
  return allProgress.find((progress) => progress.cardId === cardId)
}

// カード進捗の取得（カードセットID指定）
export const getCardProgressByCardSetId = async (cardSetId: string): Promise<CardProgress[]> => {
  const allProgress = await getAllCardProgress()
  return allProgress.filter((progress) => progress.cardSetId === cardSetId)
}

// カード進捗の更新
export const updateCardProgress = async (id: string, updates: Partial<Omit<CardProgress, "id">>): Promise<void> => {
  const currentProgress = await runTransaction<CardProgress | undefined>(STORES.CARD_PROGRESS, "readonly", (store) => { // ESLint修正: 型引数指定, as Promise<CardProgress | undefined> 削除
    return store.get(id)
  })

  if (!currentProgress) {
    throw new Error(`Card progress with id ${id} not found`)
  }

  await runTransaction(STORES.CARD_PROGRESS, "readwrite", (store) => {
    return store.put({
      ...currentProgress,
      ...updates,
      id,
    })
  })
}

// カード進捗の削除
export const deleteCardProgress = (id: string): Promise<undefined> => {
  return runTransaction<undefined>(STORES.CARD_PROGRESS, "readwrite", (store) => { // ESLint修正: 型引数指定, as Promise<undefined> 削除
    return store.delete(id)
  })
}

// 学習セッションの追加
export const addStudySession = async (session: Omit<StudySession, "id">): Promise<string> => {
  const id = generateId()

  await runTransaction(STORES.STUDY_SESSIONS, "readwrite", (store) => {
    return store.add({
      ...session,
      id,
    })
  })

  return id
}

// 学習セッションの取得（全て）
export const getAllStudySessions = (): Promise<StudySession[]> => {
  return runTransaction<StudySession[]>(STORES.STUDY_SESSIONS, "readonly", (store) => { // ESLint修正: 型引数指定, as Promise<StudySession[]> 削除
    return store.getAll()
  })
}

// 学習セッションの取得（カードセットID指定）
export const getStudySessionsByCardSetId = async (cardSetId: string): Promise<StudySession[]> => {
  const allSessions = await getAllStudySessions()
  return allSessions.filter((session) => session.cardSetId === cardSetId)
}

// 学習セッションの更新
export const updateStudySession = async (id: string, updates: Partial<Omit<StudySession, "id">>): Promise<void> => {
  const currentSession = await runTransaction<StudySession | undefined>(STORES.STUDY_SESSIONS, "readonly", (store) => { // ESLint修正: 型引数指定, as Promise<StudySession | undefined> 削除
    return store.get(id)
  })

  if (!currentSession) {
    throw new Error(`Study session with id ${id} not found`)
  }

  await runTransaction(STORES.STUDY_SESSIONS, "readwrite", (store) => {
    return store.put({
      ...currentSession,
      ...updates,
      id,
    })
  })
}

// 学習セッションの削除
export const deleteStudySession = (id: string): Promise<undefined> => {
  return runTransaction<undefined>(STORES.STUDY_SESSIONS, "readwrite", (store) => { // ESLint修正: 型引数指定, as Promise<undefined> 削除
    return store.delete(id)
  })
}

// カードセットの学習統計を計算
export const calculateCardSetStats = async (cardSetId: string): Promise<LearningStats> => {
  const cardSet = await getCardSetById(cardSetId)
  if (!cardSet) {
    throw new Error(`Card set with id ${cardSetId} not found`)
  }

  const cardProgress = await getCardProgressByCardSetId(cardSetId)
  const studySessions = await getStudySessionsByCardSetId(cardSetId)

  // 完了したセッションのみを対象とする
  const completedSessions = studySessions.filter((session) => session.completedAt !== null)

  // マスターしたカードの割合
  const masteredCards = cardProgress.filter((progress) => progress.status === "mastered").length
  const masteredPercentage = cardSet.cards.length > 0 ? (masteredCards / cardSet.cards.length) * 100 : 0

  // 正解率
  const totalReviews = cardProgress.reduce((sum, progress) => sum + progress.correctCount + progress.incorrectCount, 0)
  const correctReviews = cardProgress.reduce((sum, progress) => sum + progress.correctCount, 0)
  const accuracy = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0

  // 平均回答時間
  const totalTimeSpent = completedSessions.reduce((sum, session) => sum + session.totalTimeSpent, 0)
  const totalCardsReviewed = completedSessions.reduce((sum, session) => sum + session.cardsReviewed, 0)
  const averageTimePerCard = totalCardsReviewed > 0 ? totalTimeSpent / totalCardsReviewed : 0

  // 学習ストリーク
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 日付順にソート
  const sortedSessions = [...completedSessions].sort((a, b) => {
    return new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
  })

  // 最終学習日
  const lastStudyDate = sortedSessions.length > 0 ? new Date(sortedSessions[0].completedAt!) : null

  // 今日学習したかどうか
  const studiedToday = lastStudyDate !== null && lastStudyDate.getTime() >= today.getTime()

  // 学習ストリークの計算
  let streak = 0
  if (sortedSessions.length > 0) {
    const currentDate = new Date(today)
    let currentStreak = studiedToday ? 1 : 0
    let i = studiedToday ? 1 : 0

    while (i < sortedSessions.length) {
      const sessionDate = new Date(sortedSessions[i].completedAt!)
      sessionDate.setHours(0, 0, 0, 0)

      currentDate.setDate(currentDate.getDate() - 1)

      if (sessionDate.getTime() === currentDate.getTime()) {
        currentStreak++
        i++
      } else if (sessionDate.getTime() > currentDate.getTime()) {
        // 同じ日に複数のセッションがある場合
        i++
      } else {
        // ストリークが途切れた
        break
      }
    }

    streak = currentStreak
  }

  return {
    masteredCards: masteredPercentage,
    accuracy,
    correctReviews,
    incorrectReviews: totalReviews - correctReviews,
    averageTimePerCard,
    studySessionsCompleted: completedSessions.length,
    studyStreak: streak,
    dailyGoalMet: studiedToday,
    lastStudyDate,
  }
}
