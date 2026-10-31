// CSS 343 - Homework 9: dynamic programming II and III.
// Fill in the TODOs, then run the program.
//
//   build:       g++ -std=c++17 -O2 hw09.cpp -o hw09
//   run:         ./hw09
//
// Everything marked GIVEN, and main() (a unit-test battery), must not be
// edited. You implement the five TODOs. Read each contract carefully: it
// states the table, the base cases, the order of the fill and the running
// time your code must have.
//
// Knapsack items are numbered from 0 in the vectors: item i has value[i] and
// weight[i], for i = 0..n-1 (n = value.size()). The knapsack TABLE has one
// more row than there are items: row i covers the first i items (items
// 0..i-1), so the row that adds item i-1 is row i, and it reads value[i-1]
// and weight[i-1]. Every weight is at least 1, every value at least 0, and
// the capacity W is at least 0.

#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// ============================================================================
// Part A - knapsack and edit distance (Lecture 17)
// ============================================================================

// ---- TODO 1: knapsackTable ---------------------------------------------------
// The full 0/1 knapsack table. Return K with n + 1 rows and W + 1 columns,
// where K[i][w] is the largest total value of a subset of the first i items
// whose total weight is at most w. Row 0 (no items) and column 0 (no
// capacity) are all 0. For i >= 1:
//   K[i][w] = K[i-1][w]                                       if weight[i-1] > w
//   K[i][w] = max(K[i-1][w], value[i-1] + K[i-1][w - weight[i-1]])   otherwise
// (skip item i-1: the cell above; take it: one row up, weight[i-1] columns
// left, plus its value). The knapsack's answer is K[n][W].
//   values {3, 4, 5, 6}, weights {2, 3, 4, 5}, W = 5:
//     row 0: 0 0 0 0 0 0      row 2: 0 0 3 4 4 7      row 4: 0 0 3 4 5 7
//     row 1: 0 0 3 3 3 3      row 3: 0 0 3 4 5 7      answer K[4][5] = 7
// The work must be about n * W.
vector<vector<int>> knapsackTable(const vector<int>& value, const vector<int>& weight, int W) {
    // TODO 1
    return {};
}

// ---- TODO 2: knapsackItems ---------------------------------------------------
// Which items an optimal subset takes. Build the table with knapsackTable,
// then walk it back from the answer cell: start at w = W and, for i = n down
// to 1, compare K[i][w] with the cell directly above it:
//   K[i][w] != K[i-1][w]   item i-1 was taken: record it, then w -= weight[i-1]
//   K[i][w] == K[i-1][w]   item i-1 was skipped
// Return the taken item indices in INCREASING order. When taking and skipping
// an item give the same value, the cell equals the one above it, so this walk
// reports the item as skipped:
//   values {3, 4, 5, 6}, weights {2, 3, 4, 5}, W = 7  ->  {1, 2}
//     (items 1 and 2: weight 7, value 9; items {0, 3} also reach 9, and the
//      walk does not report them)
// The walk is about n steps after the table is built.
vector<int> knapsackItems(const vector<int>& value, const vector<int>& weight, int W) {
    // TODO 2
    return {};
}

// ---- TODO 3: editDistance ----------------------------------------------------
// The edit (Levenshtein) distance: the fewest single-character inserts,
// deletes and replaces that turn a into b. Fill D with |a| + 1 rows and
// |b| + 1 columns, where D[i][j] is the edit distance between the first i
// characters of a and the first j characters of b:
//   D[i][0] = i  (delete all i characters)    D[0][j] = j  (insert all j)
//   D[i][j] = D[i-1][j-1]                     if a[i-1] == b[j-1]  (free match)
//   D[i][j] = 1 + min(D[i-1][j],              delete a[i-1]   (up)
//                     D[i][j-1],              insert b[j-1]   (left)
//                     D[i-1][j-1])            replace a[i-1]  (diagonal)
//                                             otherwise
// Return D[|a|][|b|].
//   editDistance("kitten", "sitting") -> 3     editDistance("", "abc") -> 3
// The work must be about |a| * |b|; our tests use strings of 3,000 characters.
int editDistance(const string& a, const string& b) {
    // TODO 3
    return 0;
}

// ============================================================================
// Part B - space saving and interval DP (Lecture 18)
// ============================================================================

// ---- TODO 4: knapsackOneRow --------------------------------------------------
// The same optimal value as knapsackTable(value, weight, W)[n][W], in about W
// memory instead of n * W. Keep ONE vector<int> K of W + 1 entries, all 0 at
// the start (row 0), and update it in place once per item: for item i, sweep
// w DOWNWARD from W to weight[i],
//   K[w] = max(K[w], value[i] + K[w - weight[i]])
// Sweeping downward, K[w - weight[i]] has not yet been rewritten during item
// i's pass, so it still holds the previous row's value and item i is used at
// most once. Sweeping upward lets item i combine with itself, which solves a
// different problem (the unbounded knapsack):
//   one item of value 3 and weight 2, W = 4  ->  3   (an upward sweep gives 6)
// Return K[W]. Our tests use W = 2,000,000 with a memory limit of about 12 MB:
// one row of W + 1 ints is 8 MB, and a full table, or two rows, does not fit.
int knapsackOneRow(const vector<int>& value, const vector<int>& weight, int W) {
    // TODO 4
    return 0;
}

// ---- TODO 5: matrixChain -----------------------------------------------------
// Matrix-chain multiplication, an interval DP. The chain A1 A2 ... An has
// matrix Ai of size dims[i-1] x dims[i], so dims has n + 1 entries (n >= 1).
// Multiplying a p x q matrix by a q x r matrix costs p*q*r scalar
// multiplications. Return the fewest scalar multiplications over all ways to
// parenthesize the chain. With dp[i][j] the cheapest cost of Ai..Aj
// (1 <= i <= j <= n):
//   dp[i][i] = 0                              (one matrix: nothing to multiply)
//   dp[i][j] = min over i <= k < j of  dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j]
// (k is where the LAST multiplication splits the range). Fill the ranges in
// order of increasing length j - i: every range reads only shorter ones.
// Costs can exceed the range of int: compute and return them in long long.
//   matrixChain({10, 30, 5, 60})      -> 4500   ((A1 A2) A3)
//   matrixChain({10, 30, 5, 60, 10})  -> 5000   ((A1 A2)(A3 A4))
// The work must be about n^3; our tests use n = 400 and dimensions up to 1,000.
long long matrixChain(const vector<int>& dims) {
    // TODO 5
    return 0;
}

// ============================================================================
// GIVEN: the unit-test battery. Do not edit below this line.
// ============================================================================
#ifndef HW09_GRADER
static int passCnt = 0, failCnt = 0;
static void check(bool ok, const char* what) {
    cout << (ok ? "  [PASS] " : "  [FAIL] ") << what << "\n";
    (ok ? passCnt : failCnt)++;
}

int main() {
    // the running example: items A B C D = 0 1 2 3
    vector<int> v = {3, 4, 5, 6}, wt = {2, 3, 4, 5};

    cout << "T1 - knapsackTable\n";
    {
        vector<vector<int>> K = knapsackTable(v, wt, 5);
        check(K.size() == 5 && K[0] == vector<int>({0, 0, 0, 0, 0, 0}) && K[1] == vector<int>({0, 0, 3, 3, 3, 3}),
              "W = 5: 5 rows of 6; row 0 all 0, row 1 (item A) 0 0 3 3 3 3");
        check(K.size() == 5 && K[2] == vector<int>({0, 0, 3, 4, 4, 7}) && K[4] == vector<int>({0, 0, 3, 4, 5, 7}),
              "W = 5: row 2 is 0 0 3 4 4 7, row 4 is 0 0 3 4 5 7, answer K[4][5] = 7");
        vector<vector<int>> K7 = knapsackTable(v, wt, 7);
        check(K7.size() == 5 && K7[3] == vector<int>({0, 0, 3, 4, 5, 7, 8, 9}) && K7[4][7] == 9,
              "W = 7: row 3 is 0 0 3 4 5 7 8 9, answer 9");
        vector<vector<int>> K0 = knapsackTable(v, wt, 0);
        check(K0 == vector<vector<int>>(5, vector<int>(1, 0)), "W = 0: five rows of a single 0");
    }

    cout << "T2 - knapsackItems\n";
    {
        check(knapsackItems(v, wt, 5) == vector<int>({0, 1}), "W = 5: items 0 1 (A + B, value 7)");
        check(knapsackItems(v, wt, 7) == vector<int>({1, 2}), "W = 7: items 1 2 (B + C, value 9); the tie with A + D reports skips");
        check(knapsackItems(v, wt, 12) == vector<int>({1, 2, 3}), "W = 12: items 1 2 3 (value 15); item 0 drops out");
        vector<int> gv = {5, 3, 3}, gw = {4, 3, 3};                  // greedy by value/weight takes item 0
        check(knapsackItems(gv, gw, 6) == vector<int>({1, 2}), "W = 6: items 1 2 (value 6), not the best-ratio item 0 (value 5)");
    }

    cout << "T3 - editDistance\n";
    {
        check(editDistance("kitten", "sitting") == 3, "kitten -> sitting: 3 (two replaces, one insert)");
        check(editDistance("MONDAY", "SUNDAY") == 2 && editDistance("abcde", "ace") == 2,
              "MONDAY -> SUNDAY: 2; abcde -> ace: 2 (two deletes)");
        check(editDistance("", "abc") == 3 && editDistance("abc", "") == 3, "to and from the empty string: 3 each");
        check(editDistance("ab", "ba") == 2 && editDistance("same", "same") == 0, "ab -> ba: 2; a string to itself: 0");
    }

    cout << "T4 - knapsackOneRow\n";
    {
        vector<int> tv = {3, 4, 5}, tw = {2, 3, 4};
        check(knapsackOneRow(tv, tw, 6) == 8, "values 3 4 5, weights 2 3 4, W = 6: 8 (the first and third items)");
        check(knapsackOneRow({3}, {2}, 4) == 3, "one item of value 3 and weight 2, W = 4: 3, not 6 (each item at most once)");
        check(knapsackOneRow(v, wt, 5) == 7 && knapsackOneRow(v, wt, 7) == 9 && knapsackOneRow(v, wt, 8) == 10,
              "the running example at W = 5, 7, 8: 7, 9, 10, as the full table gives");
    }

    cout << "T5 - matrixChain\n";
    {
        check(matrixChain({10, 30, 5, 60}) == 4500, "10x30, 30x5, 5x60: 4500, by (A1 A2) A3");
        check(matrixChain({10, 30, 5, 60, 10}) == 5000, "adding 60x10: 5000, by (A1 A2)(A3 A4)");
        check(matrixChain({5, 10, 2, 20}) == 300 && matrixChain({7, 8}) == 0, "5x10, 10x2, 2x20: 300; a single matrix: 0");
    }

    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
