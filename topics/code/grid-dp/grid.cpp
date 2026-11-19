// CSS 343 - topic program: grid DP, the cheapest right/down path and the number
// of right/down paths, exactly as on the slides (the DP Patterns chapter's code),
// checked against brute force over every path.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 grid.cpp -o grid
//   run:    ./grid
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// Grid DP. Cheapest right/down path through a grid of nonnegative costs.
// The two edge loops exist so that no interior min ever reads a missing
// neighbor. Theta(mn) time and space.
int minCostPath(const vector<vector<int>>& cost) {
    int m = cost.size(), n = cost[0].size();
    vector<vector<int>> dp(m, vector<int>(n));
    dp[0][0] = cost[0][0];                             // origin: no predecessor
    for (int j = 1; j < n; j++)
        dp[0][j] = cost[0][j] + dp[0][j-1];            // top edge: left only
    for (int i = 1; i < m; i++)
        dp[i][0] = cost[i][0] + dp[i-1][0];            // left edge: up only
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[i][j] = cost[i][j] + min(dp[i-1][j],    // interior: choose
                                        dp[i][j-1]);
    return dp[m-1][n-1];
}

// Same cells, same order, sum instead of min: how many monotone paths reach
// the corner. A blocked cell contributes 0, erasing every path through it.
long long countPaths(const vector<vector<bool>>& blocked) {
    int m = blocked.size(), n = blocked[0].size();
    vector<vector<long long>> dp(m, vector<long long>(n, 0));
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++) {
            if (blocked[i][j]) continue;               // stays 0
            if (i == 0 && j == 0) { dp[0][0] = 1; continue; }
            dp[i][j] = (i ? dp[i-1][j] : 0) + (j ? dp[i][j-1] : 0);
        }
    return dp[m-1][n-1];
}

// brute force: every right/down path
int bestPath(const vector<vector<int>>& c, int i, int j) {
    int m = c.size(), n = c[0].size();
    if (i == m - 1 && j == n - 1) return c[i][j];
    int best = 1 << 29;
    if (i + 1 < m) best = min(best, bestPath(c, i + 1, j));
    if (j + 1 < n) best = min(best, bestPath(c, i, j + 1));
    return c[i][j] + best;
}

void show(const vector<vector<int>>& cost) {
    int m = cost.size(), n = cost[0].size();
    vector<vector<int>> dp(m, vector<int>(n));
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            dp[i][j] = cost[i][j] + (i == 0 && j == 0 ? 0 : min(i ? dp[i-1][j] : 1 << 29, j ? dp[i][j-1] : 1 << 29));
    cout << "cheapest " << minCostPath(cost) << " (brute force " << bestPath(cost, 0, 0) << "); dp rows:";
    for (auto& r : dp) { cout << " |"; for (int x : r) cout << " " << x; }
    cout << "\n";
}

int main() {
    show({{1, 3, 1}, {1, 5, 1}, {4, 2, 1}});                 // the lecture
    show({{2, 1, 3}, {4, 2, 1}, {1, 5, 2}});                 // the practice
    vector<vector<bool>> open(3, vector<bool>(3, false)), wall = open;
    wall[1][1] = true;
    cout << "3x3 paths: " << countPaths(open) << "; centre blocked: " << countPaths(wall) << "\n";
    vector<vector<bool>> four(4, vector<bool>(5, false));
    cout << "4x5 paths: " << countPaths(four) << " = C(7, 3)\n";
    return 0;
}
