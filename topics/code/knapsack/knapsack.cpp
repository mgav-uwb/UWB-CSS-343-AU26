// CSS 343 - topic program: the 0/1 knapsack table and its traceback, with the
// items 0-based in the vectors as Homework 9 has them (row i reads value[i-1]),
// and every number the slides quote, checked against brute force over subsets.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 knapsack.cpp -o knapsack
//   run:    ./knapsack
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// K[i][w] = the best value of the first i items within capacity w.
// Row i is item i - 1 of the vectors. Theta(nW) time and space.
int knapsack(const vector<int>& value, const vector<int>& weight, int W,
             vector<vector<int>>& K) {
    int n = value.size();
    K.assign(n + 1, vector<int>(W + 1, 0));       // row 0: no items, value 0
    for (int i = 1; i <= n; i++)
        for (int w = 0; w <= W; w++) {
            K[i][w] = K[i - 1][w];                // skip item i - 1
            if (weight[i - 1] <= w)               // it fits: try taking it
                K[i][w] = max(K[i][w],
                              value[i - 1] + K[i - 1][w - weight[i - 1]]);
        }
    return K[n][W];
}

// Walk back from K[n][W]: item i - 1 was taken exactly when the cell differs
// from the one above it; then its weight leaves the capacity.
vector<int> takenItems(const vector<int>& weight, int W,
                       const vector<vector<int>>& K) {
    vector<int> taken;
    int w = W;
    for (int i = (int)weight.size(); i >= 1; i--)
        if (K[i][w] != K[i - 1][w]) {             // taking item i - 1 made it
            taken.push_back(i - 1);
            w -= weight[i - 1];
        }
    reverse(taken.begin(), taken.end());          // in item order
    return taken;
}

int brute(const vector<int>& value, const vector<int>& weight, int W) {
    int n = value.size(), best = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        int v = 0, w = 0;
        for (int i = 0; i < n; i++) if (mask >> i & 1) { v += value[i]; w += weight[i]; }
        if (w <= W) best = max(best, v);
    }
    return best;
}

int greedyRatio(const vector<int>& value, const vector<int>& weight, int W) {
    vector<int> order;
    for (int i = 0; i < (int)value.size(); i++) order.push_back(i);
    for (size_t a = 0; a < order.size(); a++)             // highest value per weight first
        for (size_t b = a + 1; b < order.size(); b++)
            if (value[order[b]] * weight[order[a]] > value[order[a]] * weight[order[b]]) swap(order[a], order[b]);
    int v = 0;
    for (int i : order) if (weight[i] <= W) { v += value[i]; W -= weight[i]; }
    return v;
}

void report(const string& name, const vector<int>& value, const vector<int>& weight, int W, bool table) {
    vector<vector<int>> K;
    int best = knapsack(value, weight, W, K);
    vector<int> t = takenItems(weight, W, K);
    cout << name << " W = " << W << ": best " << best << " (brute force " << brute(value, weight, W)
         << ", ratio greedy " << greedyRatio(value, weight, W) << "), items";
    for (int i : t) cout << " " << char('A' + i);
    cout << "\n";
    if (table)
        for (size_t i = 0; i < K.size(); i++) {
            cout << "   row " << i << ":";
            for (int x : K[i]) cout << " " << x;
            cout << "\n";
        }
}

int main() {
    vector<int> value = {3, 4, 5, 6}, weight = {2, 3, 4, 5};      // items A, B, C, D
    report("A-D", value, weight, 5, true);
    for (int W : {7, 9, 12, 14}) report("A-D", value, weight, W, false);
    report("P Q R (letters A B C)", {5, 3, 3}, {4, 3, 3}, 6, false);
    for (int bits = 10; bits <= 40; bits += 10)
        cout << "W with " << bits << " bits: up to " << ((1L << bits) - 1) << " columns per row\n";
    return 0;
}
