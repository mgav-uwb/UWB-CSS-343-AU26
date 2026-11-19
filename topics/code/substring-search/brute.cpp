// CSS 343 - topic program: brute-force substring search (the Substring Search
// chapter's code), with its comparisons counted on the slides' examples.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 brute.cpp -o brute
//   run:    ./brute
#include <iostream>
#include <string>
using namespace std;

// Brute-force substring search: try the pattern at EVERY start position; on a
// mismatch, slide by ONE and restart the comparison. Worst case Theta(nm):
// text characters get re-examined after a partial match.
int bruteSearch(const string& t, const string& p) {
    int n = t.size(), m = p.size();
    for (int i = 0; i <= n - m; i++) {     // each start position
        int j = 0;
        while (j < m && t[i + j] == p[j]) j++;   // compare left to right
        if (j == m) return i;              // all m matched: found at i
    }
    return -1;                             // no occurrence
}

long compares = 0;
int bruteCounted(const string& t, const string& p) {
    int n = t.size(), m = p.size();
    for (int i = 0; i <= n - m; i++) {
        int j = 0;
        while (j < m && (++compares, t[i + j] == p[j])) j++;
        if (j == m) return i;
    }
    return -1;
}

void report(const string& t, const string& p) {
    compares = 0;
    int at = bruteCounted(t, p);
    cout << p << " in " << (t.size() > 40 ? t.substr(0, 20) + "... (" + to_string(t.size()) + " chars)" : t)
         << ": " << at << " (plain " << bruteSearch(t, p) << "), " << compares << " comparisons\n";
}

int main() {
    report("ABABABCABABABCAB", "ABABC");
    report(string(20, 'A') + "B", "AAAAB");
    report(string(1000, 'A') + "B", string(99, 'A') + "B");
    return 0;
}
