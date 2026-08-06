import { graphql } from '@octokit/graphql';
import type { GitHubUserStats } from './types';

const GITHUB_GRAPHQL_QUERY = `
  query GetUserStats($login: String!) {
    user(login: $login) {
      login
      contributionsCollection {
        totalContributions
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
      }
      repositories(first: 100) {
        totalCount
        edges {
          node {
            stargazers {
              totalCount
            }
          }
        }
      }
      pullRequests(first: 1) {
        totalCount
      }
      issues(first: 1) {
        totalCount
      }
    }
  }
`;

const LAST_YEAR_QUERY = `
  query GetLastYearStats($login: String!) {
    user(login: $login) {
      contributionsCollection(
        from: "2024-01-01T00:00:00Z"
        to: "2025-01-01T00:00:00Z"
      ) {
        totalContributions
      }
    }
  }
`;

export async function fetchGitHubStats(username: string): Promise<GitHubUserStats> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set');
  }

  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });

  try {
    const userDataResponse = await graphqlWithAuth(GITHUB_GRAPHQL_QUERY, {
      login: username,
    });

    const userData = userDataResponse as any;
    const user = userData.user;

    if (!user) {
      throw new Error(`User ${username} not found`);
    }

    const lastYearResponse = await graphqlWithAuth(LAST_YEAR_QUERY, {
      login: username,
    });

    const lastYearData = lastYearResponse as any;

    const repositoryStars = user.repositories.edges.reduce(
      (total: number, edge: any) => total + (edge.node.stargazers.totalCount || 0),
      0
    );

    const stats: GitHubUserStats = {
      username: user.login,
      totalContributions: user.contributionsCollection.totalContributions,
      totalCommitContributions: user.contributionsCollection.totalCommitContributions,
      totalIssueContributions: user.contributionsCollection.totalIssueContributions,
      totalPullRequestContributions: user.contributionsCollection.totalPullRequestContributions,
      totalPullRequestReviewContributions: user.contributionsCollection.totalPullRequestReviewContributions,
      totalRepositories: user.repositories.totalCount,
      repositoryStars,
      lastYearContributions: lastYearData.user.contributionsCollection.totalContributions,
      fetchedAt: new Date().toISOString(),
    };

    return stats;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch GitHub stats: ${error.message}`);
    }
    throw error;
  }
}
