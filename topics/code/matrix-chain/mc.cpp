// CSS 343 - topic program: matrix-chain order, the table and the traceback
// exactly as on the slides (the Matrix-Chain Multiplication chapter's code),
// checked against brute force over every parenthesization.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 mc.cpp -o mc
//   run:    ./mc
#include <climits>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// Matrix-chain order. p has n+1 entries; A_i is p[i-1] x p[i], i = 1..n.
// m[i][j] = min scalar multiplications for A_i..A_j; s[i][j] = winning split.
// Theta(n^3) time, Theta(n^2) space.
int matrixChain(const vector<int>& p,
                vector<vector<int>>& m, vector<vector<int>>& s) {
    int n = (int)p.size() - 1;
    m.assign(n + 2, vector<int>(n + 2, 0));   // base case: m[i][i] = 0
    s.assign(n + 2, vector<int>(n + 2, 0));
    for (int L = 2; L <= n; L++)              // range length, shortest first
        for (int i = 1; i + L - 1 <= n; i++) {
            int j = i + L - 1;
            m[i][j] = INT_MAX;
            for (int k = i; k < j; k++) {     // every outermost split
                int c = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j];
                if (c < m[i][j]) { m[i][j] = c; s[i][j] = k; }
            }
        }
    return m[1][n];
}

// Traceback: s[i][j] names the last multiply of the range.
string parens(const vector<vector<int>>& s, int i, int j) {
    if (i == j) return "A" + to_string(i);
    int k = s[i][j];
    return "(" + parens(s, i, k) + parens(s, k + 1, j) + ")";
}

long brute(const vector<int>& p, int i, int j) {          // every split, no memory
    if (i == j) return 0;
    long best = -1;
    for (int k = i; k < j; k++) {
        long c = brute(p, i, k) + brute(p, k + 1, j) + (long)p[i - 1] * p[k] * p[j];
        if (best < 0 || c < best) best = c;
    }
    return best;
}

void report(const vector<int>& p) {
    vector<vector<int>> m, s;
    int best = matrixChain(p, m, s);
    int n = p.size() - 1;
    cout << "p =";
    for (int x : p) cout << " " << x;
    cout << ": " << best << " (brute force " << brute(p, 1, n) << ") " << parens(s, 1, n) << "\n";
    for (int i = 1; i <= n; i++) {
        cout << "   m[" << i << "][..]:";
        for (int j = 1; j <= n; j++) cout << " " << (j < i ? string("-") : to_string(m[i][j]));
        cout << "    s:";
        for (int j = 1; j <= n; j++) cout << " " << (j <= i ? string("-") : to_string(s[i][j]));
        cout << "\n";
    }
}

int main() {
    report({10, 30, 5, 60});                  // the two orders differ six-fold
    report({4, 10, 3, 12, 5});                // the lecture's table
    report({2, 6, 3, 4});                     // the practice
    long catalan[11] = {1, 1, 2, 5, 14, 42, 132, 429, 1430, 4862, 16796};
    cout << "parenthesizations of n matrices: n = 4: " << catalan[3] << ", n = 10: " << catalan[9] << "\n";
    return 0;
}
