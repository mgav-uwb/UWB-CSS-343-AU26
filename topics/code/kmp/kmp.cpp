// CSS 343 - topic program: KMP exactly as on the slides (the KMP chapter's
// code and Homework 10's conventions: fail[j] over P[0..j], all matches by
// j = fail[m - 1]), with comparisons counted the way Homework 10 counts them
// and every answer checked against brute force.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 kmp.cpp -o kmp
//   run:    ./kmp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// Failure function: fail[j] = length of the longest proper prefix of the
// pattern's first j+1 characters that is also a suffix of them. Built by
// matching the pattern against ITSELF: k falls back through the very table
// under construction. Theta(m).
vector<int> failureFn(const string& p) {
    int m = p.size();
    vector<int> fail(m, 0);
    int k = 0;                             // the current border's length
    for (int j = 1; j < m; j++) {
        while (k > 0 && p[j] != p[k]) k = fail[k - 1];  // a shorter border
        if (p[j] == p[k]) k++;             // extend the border
        fail[j] = k;
    }
    return fail;
}

// KMP search: the text pointer i NEVER decreases; on a mismatch only the
// pattern pointer j falls back, via the table. Theta(n + m) total.
int kmpSearch(const string& t, const string& p) {
    vector<int> fail = failureFn(p);
    int j = 0;                             // characters matched so far
    for (int i = 0; i < (int)t.size(); i++) {
        while (j > 0 && t[i] != p[j]) j = fail[j - 1];  // fall back
        if (t[i] == p[j]) j++;             // extend the partial match
        if (j == (int)p.size()) return i - j + 1;       // a full match
    }
    return -1;                             // no occurrence
}

// Every occurrence, overlaps included: after a match, continue from fail[m - 1].
vector<int> kmpAll(const string& t, const string& p, long& compares) {
    vector<int> fail = failureFn(p), out;
    int j = 0, m = p.size();
    compares = 0;
    for (int i = 0; i < (int)t.size(); i++) {
        while (j > 0 && t[i] != p[j]) { compares++; j = fail[j - 1]; }   // one per fall-back
        compares++;                                                       // plus one
        if (t[i] == p[j]) j++;
        if (j == m) { out.push_back(i - m + 1); j = fail[m - 1]; }
    }
    return out;
}

// Comparisons up to the FIRST match, counted as Homework 10 counts them.
long firstMatchCompares(const string& t, const string& p) {
    vector<int> fail = failureFn(p);
    int j = 0; long compares = 0;
    for (int i = 0; i < (int)t.size(); i++) {
        while (j > 0 && t[i] != p[j]) { compares++; j = fail[j - 1]; }
        compares++;
        if (t[i] == p[j]) j++;
        if (j == (int)p.size()) return compares;
    }
    return compares;
}

vector<int> bruteAll(const string& t, const string& p) {
    vector<int> out;
    for (size_t i = 0; i + p.size() <= t.size(); i++) if (t.compare(i, p.size(), p) == 0) out.push_back(i);
    return out;
}

void table(const string& p) {
    cout << "fail(" << p << "):";
    for (int x : failureFn(p)) cout << " " << x;
    cout << "\n";
}

void report(const string& t, const string& p) {
    long c; vector<int> all = kmpAll(t, p, c);
    cout << p << " in " << t << ": first " << kmpSearch(t, p) << ", all";
    for (int x : all) cout << " " << x;
    cout << (all == bruteAll(t, p) ? "" : "  MISMATCH") << "; " << c << " comparisons (n = " << t.size() << ")\n";
}

int main() {
    for (string p : {"AABAA", "ABABA", "ABABC", "ABAABA", "AABAAB", "AAAA", "ABCDABD"}) table(p);
    report("ABABABCABABABCAB", "ABABC");
    report("AABAAABAAB", "AABAAB");
    report("ABABABA", "ABA");
    report(string(20, 'A') + "B", "AAAAB");
    cout << "to the first match: AABAAC in AABAABAAC " << firstMatchCompares("AABAABAAC", "AABAAC")
         << ", in AABAAXAABAAC " << firstMatchCompares("AABAAXAABAAC", "AABAAC")
         << ", ABABC in ABABABCABABABCAB " << firstMatchCompares("ABABABCABABABCAB", "ABABC") << "\n";
    return 0;
}
