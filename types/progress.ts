export interface CardProgress {
  cardId: string
  status: "new" | "learning" | "mastered"
  correctCount: number
  incorrectCount: number
  lastReviewedAt: Date | null
  nextReviewAt: Date | null
  easeFactor: number
  interval: number
}

export interface StudySession {
  id: string
  cardSetId: string
  startedAt: Date
  completedAt: Date | null
  cardsReviewed: number
  correctAnswers: number
  incorrectAnswers: number
  totalTimeSpent: number
}

export interface LearningStats {
  masteredCards: number
  accuracy: number
  correctReviews: number
  incorrectReviews: number
  averageTimePerCard: number
  studySessionsCompleted: number
  studyStreak: number
  dailyGoalMet: boolean
  lastStudyDate: Date | null
}
