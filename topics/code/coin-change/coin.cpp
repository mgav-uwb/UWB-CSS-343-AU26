// CSS 343 - topic program: coin change, the fewest coins (the DP Patterns
// chapter's code), the greedy that fails, and the unreachable amounts.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 coin.cpp -o coin
//   run:    ./coin
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// Coin change. dp[a] = fewest coins summing to a, or NONE if a is unreachable.
// A coin is usable at a only if it fits AND the amount it leaves is reachable;
// skipping that second test would invent counts for impossible amounts.
// Theta(amount * coins.size()) time, Theta(amount) space.
const int NONE = -1;
int coinChange(const vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, NONE);
    dp[0] = 0;                                       // base: no coins needed
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a && dp[a - c] != NONE &&
                (dp[a] == NONE || dp[a - c] + 1 < dp[a]))
                dp[a] = dp[a - c] + 1;               // this coin used last
    return dp[amount];                               // NONE: not payable
}

int greedy(vector<int> coins, int a) {               // largest coin first
    sort(coins.rbegin(), coins.rend());
    int n = 0;
    for (int c : coins) while (c <= a) { a -= c; n++; }
    return a == 0 ? n : NONE;
}

void table(const vector<int>& coins, int upto) {
    cout << "coins";
    for (int c : coins) cout << " " << c;
    cout << ": dp[0.." << upto << "] =";
    for (int a = 0; a <= upto; a++) cout << " " << coinChange(coins, a);
    cout << "; greedy at " << upto << ": " << greedy(coins, upto) << "\n";
}

int main() {
    table({1, 3, 4}, 6);
    table({3, 5}, 8);
    table({1, 4, 5}, 8);
    return 0;
}
