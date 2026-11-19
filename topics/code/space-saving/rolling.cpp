// CSS 343 - topic program: tables that keep only the rows still read. The
// one-row knapsack (items 0-based, as Homework 9), its forward sweep (which is
// the unbounded knapsack), and the two-row edit distance (the Traceback and
// Space-Saving chapter's code), each checked against the full table.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 rolling.cpp -o rolling
//   run:    ./rolling
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// 0/1 knapsack value in one row of W + 1 cells, swept right to left so that
// K[w - weight[i]] still holds the previous row's value. Theta(W) space.
int knapsackOneRow(const vector<int>& value, const vector<int>& weight, int W) {
    vector<int> K(W + 1, 0);                      // row 0: no items
    for (int i = 0; i < (int)value.size(); i++)
        for (int w = W; w >= weight[i]; w--)      // BACKWARD: each item once
            K[w] = max(K[w], value[i] + K[w - weight[i]]);
    return K[W];
}

// The same loop swept left to right: K[w - weight[i]] may already include
// item i, so items can be taken again. That is the unbounded knapsack.
int knapsackForward(const vector<int>& value, const vector<int>& weight, int W) {
    vector<int> K(W + 1, 0);
    for (int i = 0; i < (int)value.size(); i++)
        for (int w = weight[i]; w <= W; w++)      // FORWARD: copies allowed
            K[w] = max(K[w], value[i] + K[w - weight[i]]);
    return K[W];
}

// Edit-distance value in Theta(n) space: keep TWO rows, the previous and the
// current, swapping after each row. Same fill, same answer -- no traceback.
int editDistanceValue(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<int> prev(n + 1), cur(n + 1);
    for (int j = 0; j <= n; j++) prev[j] = j;         // row 0: insert all of b
    for (int i = 1; i <= m; i++) {
        cur[0] = i;                                   // column 0: delete all
        for (int j = 1; j <= n; j++)
            cur[j] = (a[i-1] == b[j-1])
                       ? prev[j-1]                    // match: free diagonal
                       : 1 + min({prev[j],            // delete
                                  cur[j-1],           // insert
                                  prev[j-1]});        // replace
        swap(prev, cur);                              // now the previous row
    }
    return prev[n];                                   // the last computed row
}

int knapsackTable(const vector<int>& value, const vector<int>& weight, int W) {
    vector<vector<int>> K(value.size() + 1, vector<int>(W + 1, 0));
    for (size_t i = 1; i <= value.size(); i++)
        for (int w = 0; w <= W; w++) {
            K[i][w] = K[i - 1][w];
            if (weight[i - 1] <= w) K[i][w] = max(K[i][w], value[i - 1] + K[i - 1][w - weight[i - 1]]);
        }
    return K[value.size()][W];
}
int unboundedTable(const vector<int>& value, const vector<int>& weight, int W) {   // dp over capacity
    vector<int> best(W + 1, 0);
    for (int w = 1; w <= W; w++)
        for (size_t i = 0; i < value.size(); i++)
            if (weight[i] <= w) best[w] = max(best[w], value[i] + best[w - weight[i]]);
    return best[W];
}

int main() {
    vector<int> value = {3, 4, 5, 6}, weight = {2, 3, 4, 5};
    for (int W : {5, 7, 9}) {
        cout << "A-D W = " << W << ": one row backward " << knapsackOneRow(value, weight, W)
             << " (table " << knapsackTable(value, weight, W) << "), forward " << knapsackForward(value, weight, W)
             << " (unbounded " << unboundedTable(value, weight, W) << ")\n";
    }
    vector<int> v1 = {7}, w1 = {3};
    cout << "one item (7, 3), W = 9: backward " << knapsackOneRow(v1, w1, 9) << ", forward " << knapsackForward(v1, w1, 9) << "\n";
    for (int W = 3; W <= 9; W++) {
        vector<int> K(W + 1, 0);
        for (int w = W; w >= 3; w--) K[w] = max(K[w], 7 + K[w - 3]);
        if (W == 9) { cout << "   backward row:"; for (int x : K) cout << " " << x; cout << "\n"; }
    }
    vector<int> F(10, 0);
    for (int w = 3; w <= 9; w++) F[w] = max(F[w], 7 + F[w - 3]);
    cout << "   forward row:"; for (int x : F) cout << " " << x; cout << "\n";
    cout << "kitten -> sitting in two rows: " << editDistanceValue("kitten", "sitting") << "\n";
    return 0;
}
