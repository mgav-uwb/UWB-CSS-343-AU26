// CSS 343 - topic program: the LCS table exactly as on the slides (the function
// Homework 8 asks for), printed for the lecture's
// pair and the practice, with the invariants the sanity-check slide states
// checked on random pairs.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 lcs.cpp -o lcs
//   run:    ./lcs
#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// LCS table: L[i][j] = LCS length of A's first i chars and B's first j.
// Fill row by row -- up, left, and diagonal are ready when a cell needs them.
// Theta(mn) time and space.
int lcsLength(const string& A, const string& B, vector<vector<int>>& L) {
    int m = A.size(), n = B.size();         // the two lengths
    L.assign(m + 1, vector<int>(n + 1, 0)); // m + 1 rows of n + 1 zeros
    for (int i = 1; i <= m; i++)            // row 0 stays 0: A's empty prefix
        for (int j = 1; j <= n; j++)        // col 0 stays 0: B's empty prefix
            if (A[i - 1] == B[j - 1])       // the prefixes' last chars match?
                L[i][j] = L[i - 1][j - 1] + 1;             // match: diagonal + 1
            else                            // the last chars differ
                L[i][j] = max(L[i - 1][j], L[i][j - 1]);   // drop one: up / left
    return L[m][n];                         // bottom-right = the answer
}

void printTable(const string& A, const string& B) {
    vector<vector<int>> L;
    int len = lcsLength(A, B, L);
    cout << "LCS(" << A << ", " << B << ") = " << len << "\n     -";
    for (char c : B) cout << "  " << c;
    cout << "\n";
    for (size_t i = 0; i <= A.size(); i++) {
        cout << "  " << (i ? A[i - 1] : '-') << " ";
        for (size_t j = 0; j <= B.size(); j++) cout << "  " << L[i][j];
        cout << "\n";
    }
}

// brute force: the longest subsequence of A that is also a subsequence of B
bool isSubseq(const string& s, const string& t) {
    size_t k = 0;
    for (char c : t) if (k < s.size() && s[k] == c) k++;
    return k == s.size();
}
int brute(const string& A, const string& B) {
    int best = 0;
    for (int mask = 0; mask < (1 << A.size()); mask++) {
        string s;
        for (size_t i = 0; i < A.size(); i++) if (mask >> i & 1) s += A[i];
        if ((int)s.size() > best && isSubseq(s, B)) best = s.size();
    }
    return best;
}

int main() {
    printTable("AGCAT", "GAC");
    printTable("ABCB", "BDCB");
    printTable("AB", "CB");
    srand(343);
    int bad = 0;
    for (int t = 0; t < 2000; t++) {
        string A, B;
        for (int i = rand() % 9; i > 0; i--) A += char('A' + rand() % 3);
        for (int i = rand() % 9; i > 0; i--) B += char('A' + rand() % 3);
        vector<vector<int>> L;
        if (lcsLength(A, B, L) != brute(A, B)) bad++;
        for (size_t i = 1; i <= A.size(); i++)          // never decreases; steps of at most 1
            for (size_t j = 1; j <= B.size(); j++) {
                int up = L[i][j] - L[i - 1][j], left = L[i][j] - L[i][j - 1];
                if (up < 0 || up > 1 || left < 0 || left > 1) bad++;
            }
    }
    cout << "2000 random pairs against brute force, invariants checked: " << bad << " failures\n";
    return 0;
}
