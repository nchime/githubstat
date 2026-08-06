/**
 * GitHub 사용자 통계 데이터 타입
 */
export interface GitHubUserStats {
  username: string;
  totalContributions: number;
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositories: number;
  repositoryStars: number;
  lastYearContributions: number;
  fetchedAt: string;
}

/**
 * SVG 테마 설정
 */
export interface Theme {
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  successColor: string;
}

/**
 * API 요청 파라미터
 */
export interface StatsQueryParams {
  username: string;
  theme?: string;
  bg_color?: string;
  text_color?: string;
  accent_color?: string;
  hide?: string;
  lang?: string;
  refresh?: string;
}

/**
 * 캐시 데이터 구조
 */
export interface CacheEntry {
  data: GitHubUserStats;
  timestamp: number;
  expiresAt: number;
}

/**
 * API 응답 (에러 포함)
 */
export interface APIResponse {
  success: boolean;
  data?: GitHubUserStats;
  error?: string;
  cachedAt?: number;
}
