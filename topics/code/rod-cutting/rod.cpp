// CSS 343 - topic program: rod cutting. The table and the traceback exactly as
// on the slides (the tie rule of the Rod Cutting chapter and Homework 8: the
// FIRST winning cut is kept on a tie), the plain recursion with its 2^n calls,
// the ratio-greedy that fails, and every number the slides quote.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 rod.cpp -o rod
//   run:    ./rod
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// Rod cutting, tabulated: best[len] = max over first cuts i of
// price[i] + best[len-i], recording the winning i in cut[len] for the
// traceback. n subproblems x O(n) choices each = Theta(n^2) time, Theta(n) space.
// price[i] = price of a piece of length i (price[0] unused); returns the
// best revenue for length n and sets cut[len] = the winning first cut.
int rodCut(const vector<int>& price, int n, vector<int>& cut) {
    vector<int> best(n + 1, 0);           // n + 1 zeros; best[0] = 0: empty rod
    cut.assign(n + 1, 0);                 // resize cut to n + 1 elements, all 0
    for (int len = 1; len <= n; len++) {  // each length, smallest first
        int m = -1;                       // best so far; any real cut beats it
        for (int i = 1; i <= len; i++)    // try every first cut
            if (price[i] + best[len - i] > m) {   // strict >: ties keep first i
                m = price[i] + best[len - i];     // piece i + best of the rest
                cut[len] = i;             // remember the choice that won
            }
        best[len] = m;                    // reuses smaller best[] -- the overlap
    }
    return best[n];                       // the whole rod's best revenue
}

// Traceback: repeatedly take the recorded first cut until nothing is left.
vector<int> pieces(const vector<int>& cut, int n) {   // cut: filled by rodCut
    vector<int> out;                      // empty; the pieces, in cut order
    while (n > 0) {                       // until the rod is used up
        out.push_back(cut[n]);            // append the winning first cut at n
        n -= cut[n];                      // cut it off, continue on the rest
    }
    return out;                           // the pieces of an optimal cut
}

// The plain recursion: try every first cut, solve the rest from scratch.
long calls = 0;
int rodPlain(const vector<int>& price, int n) {
    calls++;
    if (n == 0) return 0;
    int m = -1;
    for (int i = 1; i <= n; i++) m = max(m, price[i] + rodPlain(price, n - i));
    return m;
}

// Greedy by value per unit length: take the best ratio that fits, repeat.
int greedyRatio(const vector<int>& price, int n) {
    int total = 0;
    while (n > 0) {
        int pick = 1;
        for (int i = 1; i <= n; i++)
            if ((double)price[i] / i > (double)price[pick] / pick) pick = i;
        total += price[pick]; n -= pick;
    }
    return total;
}

string show(const vector<int>& v, int from = 0) {
    string s;
    for (size_t i = from; i < v.size(); i++) s += (s.empty() ? "" : " ") + to_string(v[i]);
    return s;
}

void report(const vector<int>& price, int n) {
    vector<int> cut;
    int best = rodCut(price, n, cut);
    vector<int> b(n + 1, 0), c;
    for (int len = 0; len <= n; len++) b[len] = rodCut(price, len, c);
    calls = 0; int plain = rodPlain(price, n);
    cout << "prices " << show(price, 1) << ", n = " << n << ": best[0.." << n << "] = " << show(b)
         << "; cut[1.." << n << "] = " << show(cut, 1) << "; pieces " << show(pieces(cut, n))
         << "; plain recursion " << calls << " calls, same answer: " << (plain == best ? "yes" : "NO")
         << "; ratio greedy " << greedyRatio(price, n) << "\n";
}

int main() {
    report({0, 1, 5, 8, 9}, 4);           // the lecture
    report({0, 2, 4, 7, 8}, 4);           // the practice: ties keep the first winner
    report({0, 3, 5, 8, 9, 10, 17, 17, 20}, 8);   // CLRS
    return 0;
}
