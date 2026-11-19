// CSS 343 - topic program: the longest increasing subsequence (the DP Patterns
// chapter's code), with the subsequence read back through from[] and every
// answer checked against brute force over subsets.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 lis.cpp -o lis
//   run:    ./lis
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// Longest increasing subsequence. dp[i] = length of the longest strictly
// increasing subsequence ENDING AT i. Initializing to 1 is the start-new
// branch; the inner loop is the extend branch. Theta(n^2) time, Theta(n) space.
int lis(const vector<int>& a, vector<int>& dp, vector<int>& from) {
    int n = a.size(), best = 0;
    dp.assign(n, 1); from.assign(n, -1);            // from[i]: predecessor index
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++)
            if (a[j] < a[i] && dp[j] + 1 > dp[i]) { // strict: increasing
                dp[i] = dp[j] + 1;                  // extend the run ending at j
                from[i] = j;
            }
        best = max(best, dp[i]);                    // answer lives anywhere
    }
    return best;                                    // 0 on an empty array
}

int brute(const vector<int>& a) {
    int n = a.size(), best = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        int last = -2000000000, len = 0; bool ok = true;
        for (int i = 0; i < n && ok; i++) if (mask >> i & 1) { if (a[i] <= last) ok = false; last = a[i]; len++; }
        if (ok) best = max(best, len);
    }
    return best;
}

void report(const vector<int>& a) {
    vector<int> dp, from;
    int best = lis(a, dp, from);
    int end = max_element(dp.begin(), dp.end()) - dp.begin();
    vector<int> seq;
    for (int i = end; i != -1; i = from[i]) seq.push_back(a[i]);
    reverse(seq.begin(), seq.end());
    cout << "a:"; for (int x : a) cout << " " << x;
    cout << "  dp:"; for (int x : dp) cout << " " << x;
    cout << "  LIS " << best << " (brute force " << brute(a) << "):";
    for (int x : seq) cout << " " << x;
    cout << "\n";
}

int main() {
    report({3, 1, 4, 1, 5, 9, 2, 6});
    report({10, 9, 2, 5, 3, 7, 101, 18});
    report({5, 4, 3, 2, 1});
    return 0;
}
