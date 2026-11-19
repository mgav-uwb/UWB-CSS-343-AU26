// CSS 343 - topic program: Boyer-Moore with the bad-character rule exactly as
// on the slides (the Boyer-Moore chapter's code and Homework 10's conventions),
// with every comparison counted and each answer checked against brute force.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 bm.cpp -o bm
//   run:    ./bm
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// Bad-character table: right[c] = index of the RIGHTMOST occurrence of c in
// the pattern, -1 if absent. One pass, later occurrences overwrite: Theta(m + R).
vector<int> rightmost(const string& p) {
    vector<int> right(256, -1);
    for (int j = 0; j < (int)p.size(); j++)
        right[(unsigned char)p[j]] = j;
    return right;
}

// Boyer-Moore, bad-character rule: compare each alignment RIGHT to left; on a
// mismatch at p[j] against text character c, slide so the pattern's rightmost
// c lands under it: shift = j - right[c], clamped to at least 1.
int bmSearch(const string& t, const string& p) {
    int n = t.size(), m = p.size();
    vector<int> right = rightmost(p);
    int skip;
    for (int i = 0; i + m <= n; i += skip) {
        skip = 0;
        for (int j = m - 1; j >= 0; j--)           // right to left
            if (p[j] != t[i + j]) {
                skip = j - right[(unsigned char)t[i + j]];
                if (skip < 1) skip = 1;            // clamp: at least 1
                break;
            }
        if (skip == 0) return i;                   // all m matched: found
    }
    return -1;                                     // no occurrence
}

int bmCounted(const string& t, const string& p, long& compares, vector<int>& aligns) {
    int n = t.size(), m = p.size();
    vector<int> right = rightmost(p);
    compares = 0; aligns.clear();
    int skip;
    for (int i = 0; i + m <= n; i += skip) {
        aligns.push_back(i);
        skip = 0;
        for (int j = m - 1; j >= 0; j--) {
            compares++;
            if (p[j] != t[i + j]) { skip = j - right[(unsigned char)t[i + j]]; if (skip < 1) skip = 1; break; }
        }
        if (skip == 0) return i;
    }
    return -1;
}

long bruteCompares(const string& t, const string& p) {
    long c = 0;
    for (size_t i = 0; i + p.size() <= t.size(); i++) {
        size_t j = 0;
        while (j < p.size() && (++c, t[i + j] == p[j])) j++;
        if (j == p.size()) return c;
    }
    return c;
}

void report(const string& t, const string& p) {
    long c; vector<int> al;
    int at = bmCounted(t, p, c, al);
    cout << p << " in \"" << t << "\": " << at << " (plain " << bmSearch(t, p) << ", find " << (int)t.find(p)
         << "), " << c << " comparisons (brute force " << bruteCompares(t, p) << "), alignments at";
    for (int x : al) cout << " " << x;
    cout << "\n";
}

int main() {
    report("HERE IS A SIMPLE EXAMPLE", "EXAMPLE");
    report("AAAAAAAAAA", "BAAAA");
    report("ABABABCABABABCAB", "ABABC");
    report("A STITCH IN TIME", "TIME");
    vector<int> r = rightmost("EXAMPLE");
    cout << "right[] of EXAMPLE: E " << r['E'] << ", X " << r['X'] << ", A " << r['A'] << ", M " << r['M']
         << ", P " << r['P'] << ", L " << r['L'] << ", S " << r['S'] << "\n";
    return 0;
}
