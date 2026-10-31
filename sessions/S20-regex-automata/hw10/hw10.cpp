// CSS 343 - Homework 10: tries, substring search, regular expressions.
// Fill in the TODOs, then run the program.
//
//   build:       g++ -std=c++17 -O2 hw10.cpp -o hw10
//   run:         ./hw10
//
// Everything marked GIVEN, and main() (a unit-test battery), must not be
// edited. You implement the seven TODOs, from Lectures 19 and 20: two on
// tries, three on substring search, two on regular expressions. Read each
// contract carefully: several ask for one thing more than the slides' code
// (a count, every occurrence, a set of states).

#include <iostream>
#include <vector>
#include <string>
#include <set>
#include <algorithm>
using namespace std;

// ============================================================================
// Part A - tries (Lecture 19)
// ============================================================================
// An R-way trie over lowercase letters: each node has one child slot per
// letter, next[c - 'a'], and a flag marking whether a stored key ends there.
// The root always exists; it stands for the empty string.

const int R = 26;                               // GIVEN

struct Node {                                   // GIVEN
    Node* next[R] = {};
    bool isWord = false;
};

// GIVEN: is key stored? Fall off the trie -> no; reach the end of key -> yes
// exactly when the node it ends on is word-marked.
bool search(Node* root, const string& key) {
    Node* t = root;
    for (char ch : key) {
        int c = ch - 'a';
        if (t->next[c] == nullptr) return false;
        t = t->next[c];
    }
    return t->isWord;
}

// GIVEN: free every node of the trie rooted at t.
void destroy(Node* t) {
    if (t == nullptr) return;
    for (int c = 0; c < R; c++) destroy(t->next[c]);
    delete t;
}

// ---- TODO 1: insert --------------------------------------------------------
// Store key (lowercase letters; it may be empty, which marks the root). Walk
// key down from the root, creating each MISSING node on the way, and mark the
// node the key ends on. Return the number of nodes this call allocated: 0
// when the whole path already exists (the key is a prefix of a stored key, or
// is stored already). Inserting into an empty trie, in this order:
//   "she" -> 3,  "shell" -> 2,  "sea" -> 2,  "she" -> 0,  "sh" -> 0
// The work must be about the length of key.
int insert(Node* root, const string& key) {
    // TODO 1
    (void)root; (void)key;
    return 0;
}

// ---- TODO 2: longestPrefixOf -----------------------------------------------
// The length of the LONGEST stored key that is a prefix of query (lowercase
// letters), or -1 if no stored key is. A key is a prefix of itself, and the
// empty key, when stored, is a prefix of every query (length 0). Walk query
// down the trie ONCE, remembering the depth of the last word-marked node
// passed (the root included); stop when the walk falls off or query ends.
//   keys {she, shells}:  "shellsort" -> 6,  "shell" -> 3,  "she" -> 3,
//                        "sh" -> -1,  "sea" -> -1
// The work must be about the length of query: do not search for each of
// query's prefixes separately.
int longestPrefixOf(Node* root, const string& query) {
    // TODO 2
    (void)root; (void)query;
    return -1;
}

// ============================================================================
// Part B - substring search (Lecture 19)
// ============================================================================
// text and pattern may hold any characters. n = text length, m = pattern length.

// ---- TODO 3: failure -------------------------------------------------------
// The KMP failure function of p: fail[j] = the length of the longest PROPER
// prefix of p[0..j] that is also a suffix of p[0..j], for j = 0 .. m-1
// (fail[0] = 0; an empty p gives an empty vector). Build it by matching the
// pattern against itself, falling back through the part of the table already
// built:
//   "AABAA" -> {0, 1, 0, 1, 2}        "ABABAC" -> {0, 0, 1, 2, 3, 0}
// The work must be about m.
vector<int> failure(const string& p) {
    // TODO 3
    (void)p;
    return {};
}

// ---- TODO 4: kmpAll --------------------------------------------------------
// Every index where pat (not empty) occurs in text, in increasing order,
// OVERLAPPING occurrences included: kmpAll("AAAA", "AA", c) is {0, 1, 2}. Use
// the KMP scan with failure(pat): the text index never moves back. After a
// full match, go on with j = fail[m-1] (j = 0 would miss the overlaps).
// Also count, in comparisons (set it to 0 first), every comparison of a text
// character with a pattern character, as the chapter's traces number them:
// each text character costs one comparison per fall-back j = fail[j-1] that
// it causes, plus one more (the comparison that matches it, or its last
// mismatch, at j = 0). The move j = fail[m-1] after a full match compares
// nothing.
//   AABAAC in AABAABAAC:     {3}, 10 comparisons (one fall-back, at text[5])
//   AABAAC in AABAAXAABAAC:  {6}, 15 comparisons (three fall-backs at the X)
// The work must be about n + m.
vector<int> kmpAll(const string& text, const string& pat, long long& comparisons) {
    // TODO 4
    (void)text; (void)pat;
    comparisons = 0;
    return {};
}

// ---- TODO 5: bmSearch ------------------------------------------------------
// The first index where pat (not empty) occurs in text, or -1, by Boyer-Moore
// with the bad-character rule. right[c] = the index of the RIGHTMOST
// occurrence of character c in pat, -1 if c does not occur (256 entries,
// indexed by (unsigned char)c). At each alignment i, compare pat[j] with
// text[i+j] for j = m-1 DOWN to 0. At the first mismatch, against text
// character c, shift the pattern by j - right[c], or by 1 if that is less
// than 1 (never slide backward). If all m characters match, return i.
// comparisons (set it to 0 first) counts every pat[j] against text[i+j] test.
//   SEARCH in "STRING SEARCH":           7, 8 comparisons
//   NEEDLE in "FINDINAHAYSTACKNEEDLE":  15, 10 comparisons
int bmSearch(const string& text, const string& pat, long long& comparisons) {
    // TODO 5
    (void)text; (void)pat;
    comparisons = 0;
    return -1;
}

// ============================================================================
// Part C - regular expressions and NFAs (Lecture 20)
// ============================================================================
// GIVEN: the NFA of a regular expression, built as the chapter builds it
// (Sedgewick's encoding of Thompson's construction). Syntax: letters,
// concatenation, | (at most one per parenthesized group), *, ( ). The regex
// is wrapped in parentheses first; state i "is" re[i], and state m (one past
// the last character) is the accept state. A letter state u consumes its own
// character and steps to u + 1; the metacharacters ( ) | * have only
// epsilon-edges. eps[u] lists the epsilon-edges out of u.
struct NFA {
    string re;                                  // "(" + pattern + ")"
    int m;                                      // re.size(); state m accepts
    vector<vector<int>> eps;                    // eps[u]: epsilon-edges out of u
};

NFA buildNFA(const string& pattern) {           // GIVEN
    NFA nfa;
    nfa.re = "(" + pattern + ")";
    nfa.m = nfa.re.size();
    nfa.eps.assign(nfa.m + 1, vector<int>());
    const string& re = nfa.re;
    int m = nfa.m;
    vector<int> ops;                            // positions of ( and |
    for (int i = 0; i < m; i++) {
        int lp = i;                             // where the atom ending at i starts
        if (re[i] == '(' || re[i] == '|') ops.push_back(i);
        else if (re[i] == ')') {
            int orPos = ops.back(); ops.pop_back();
            if (re[orPos] == '|') {             // wire the alternation
                lp = ops.back(); ops.pop_back();
                nfa.eps[lp].push_back(orPos + 1);
                nfa.eps[orPos].push_back(i);
            } else {
                lp = orPos;
            }
        }
        if (i < m - 1 && re[i + 1] == '*') {    // closure around lp..i
            nfa.eps[lp].push_back(i + 1);
            nfa.eps[i + 1].push_back(lp);
        }
        if (re[i] == '(' || re[i] == '*' || re[i] == ')')
            nfa.eps[i].push_back(i + 1);        // fall through a metacharacter
    }
    return nfa;
}

// GIVEN: does state u consume character c (and so step to u + 1)?
bool consumes(const NFA& nfa, int u, char c) {
    if (u >= nfa.m) return false;               // the accept state consumes nothing
    char r = nfa.re[u];
    if (r == '(' || r == ')' || r == '|' || r == '*') return false;
    return r == c;
}

// ---- TODO 6: epsClosure ----------------------------------------------------
// Every state reachable from a state of `states` by following zero or more
// epsilon-edges, the states themselves included: a graph search (DFS or BFS)
// over nfa.eps, seeded with all of `states`. Mark each state when it is first
// reached and expand it only then: the epsilon-edges can form cycles (a
// star's skip and repeat edges do). For A*B, wrapped "(A*B)", whose
// epsilon-edges are 0->1, 1->2, 2->1, 2->3, 4->5:
//   epsClosure({0}) = {0, 1, 2, 3}     epsClosure({4}) = {4, 5}
//   epsClosure({}) = {}
// The work must be about the number of states and edges reached.
set<int> epsClosure(const NFA& nfa, const set<int>& states) {
    // TODO 6
    (void)nfa; (void)states;
    return {};
}

// ---- TODO 7: statesAfter ---------------------------------------------------
// The set of states the NFA can be in after reading all of text. Start with
// epsClosure({0}); for each character c of text, collect u + 1 for every
// active state u with consumes(nfa, u, c), then make the epsilon-closure of
// what you collected the new active set. (An empty set stays empty.) The
// machine accepts text exactly when state m is in the result; accepts() below
// is given. For (A*B) as in TODO 6:
//   "" -> {0, 1, 2, 3}    "AAB" -> {4, 5} (accepts)    "AC" -> {}
// The work must be about m per character of text: track the whole set, and
// never try the choices one at a time.
set<int> statesAfter(const NFA& nfa, const string& text) {
    // TODO 7
    (void)nfa; (void)text;
    return {};
}

// GIVEN: does the regex match the whole of text?
bool accepts(const NFA& nfa, const string& text) {
    return statesAfter(nfa, text).count(nfa.m) > 0;
}

// ============================================================================
// GIVEN: the unit-test battery. Do not edit below this line.
// ============================================================================
#ifndef HW10_GRADER
static int passCnt = 0, failCnt = 0;
static void check(bool ok, const string& what) {
    cout << (ok ? "  [PASS] " : "  [FAIL] ") << what << "\n";
    (ok ? passCnt : failCnt)++;
}

int main() {
    cout << "T1 - insert\n";
    {
        Node* root = new Node();
        int a = insert(root, "she"), b = insert(root, "shell"), c = insert(root, "sea");
        check(a == 3 && b == 2 && c == 2, "she, shell, sea allocate 3, 2 and 2 nodes");
        check(search(root, "she") && search(root, "shell") && search(root, "sea") && !search(root, "sh"),
              "she, shell and sea are stored; sh is only a path");
        int d = insert(root, "she"), e = insert(root, "sh");
        check(d == 0 && e == 0 && search(root, "sh"), "she again and sh allocate nothing; sh is now stored");
        check(insert(root, "") == 0 && search(root, ""), "the empty key marks the root");
        destroy(root);
    }

    cout << "T2 - longestPrefixOf\n";
    {
        Node* root = new Node();
        insert(root, "she"); insert(root, "shells");
        check(longestPrefixOf(root, "shellsort") == 6, "keys {she, shells}: shellsort -> 6");
        check(longestPrefixOf(root, "shell") == 3 && longestPrefixOf(root, "she") == 3, "shell -> 3, she -> 3");
        check(longestPrefixOf(root, "sh") == -1 && longestPrefixOf(root, "sea") == -1, "sh -> -1, sea -> -1");
        insert(root, "");
        check(longestPrefixOf(root, "sea") == 0, "with the empty key stored, sea -> 0");
        destroy(root);
    }

    cout << "T3 - failure\n";
    {
        check(failure("AABAA") == vector<int>({0, 1, 0, 1, 2}), "AABAA -> 0 1 0 1 2");
        check(failure("ABABAC") == vector<int>({0, 0, 1, 2, 3, 0}), "ABABAC -> 0 0 1 2 3 0");
        check(failure("AABAAABAAAABAAAB") == vector<int>({0, 1, 0, 1, 2, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 7}),
              "AABAAABAAAABAAAB: the fall-back from 6 to 2 to 1 at j = 10");
    }

    cout << "T4 - kmpAll\n";
    {
        long long c = -1;
        check(kmpAll("AABAABAAC", "AABAAC", c) == vector<int>({3}) && c == 10, "AABAAC in AABAABAAC: {3}, 10 comparisons");
        check(kmpAll("AABAAXAABAAC", "AABAAC", c) == vector<int>({6}) && c == 15, "AABAAC in AABAAXAABAAC: {6}, 15 comparisons");
        check(kmpAll("AAAA", "AA", c) == vector<int>({0, 1, 2}) && c == 4, "AA in AAAA: {0, 1, 2} (overlapping), 4 comparisons");
        check(kmpAll("ABABABAB", "ABAB", c) == vector<int>({0, 2, 4}) && c == 8, "ABAB in ABABABAB: {0, 2, 4}, 8 comparisons");
        check(kmpAll("XYZ", "XYZW", c).empty() && c == 3, "a pattern longer than the text: none, 3 comparisons");
    }

    cout << "T5 - bmSearch\n";
    {
        long long c = -1;
        check(bmSearch("STRING SEARCH", "SEARCH", c) == 7 && c == 8, "SEARCH in STRING SEARCH: 7, 8 comparisons");
        check(bmSearch("FINDINAHAYSTACKNEEDLE", "NEEDLE", c) == 15 && c == 10, "NEEDLE in FINDINAHAYSTACKNEEDLE: 15, 10 comparisons");
        check(bmSearch("BANANABANANA", "ANAN", c) == 1 && c == 5, "ANAN in BANANABANANA: 1, 5 comparisons (shift by the RIGHTMOST A)");
        check(bmSearch("AAAAAAAAAA", "BAAAA", c) == -1 && c == 30, "BAAAA in ten A's: -1, 30 comparisons (shift 1 every time)");
        check(bmSearch("ABC", "ABCD", c) == -1 && c == 0, "a pattern longer than the text: -1, 0 comparisons");
    }

    NFA ab = buildNFA("A*B");                       // (A*B): eps 0->1, 1->2, 2->1, 2->3, 4->5
    NFA acd = buildNFA("A*B|AC");                   // (A*B|AC)
    cout << "T6 - epsClosure\n";
    {
        check(epsClosure(ab, {0}) == set<int>({0, 1, 2, 3}), "A*B: closure of {0} is {0, 1, 2, 3}");
        check(epsClosure(ab, {4}) == set<int>({4, 5}) && epsClosure(ab, {}).empty(), "A*B: closure of {4} is {4, 5}; of {} is {}");
        check(epsClosure(acd, {0}) == set<int>({0, 1, 2, 3, 5}), "A*B|AC: closure of {0} is {0, 1, 2, 3, 5} (both branches)");
    }

    cout << "T7 - statesAfter\n";
    {
        check(statesAfter(ab, "") == set<int>({0, 1, 2, 3}) && statesAfter(ab, "AAB") == set<int>({4, 5}),
              "A*B: \"\" -> {0, 1, 2, 3}, AAB -> {4, 5}");
        check(statesAfter(ab, "AC").empty() && statesAfter(ab, "BA").empty(), "A*B: AC and BA -> {}");
        check(accepts(ab, "B") && accepts(ab, "AAAB") && !accepts(ab, "") && !accepts(ab, "AABB"),
              "A*B accepts B and AAAB, rejects \"\" and AABB");
        check(accepts(acd, "AC") && accepts(acd, "AAB") && !accepts(acd, "AAC") && !accepts(acd, "A"),
              "A*B|AC accepts AC and AAB, rejects AAC and A");
        NFA ex = buildNFA("(A*B|AC)D");
        check(accepts(ex, "AAABD") && accepts(ex, "ACD") && !accepts(ex, "ABCD") && !accepts(ex, "AD"),
              "(A*B|AC)D accepts AAABD and ACD, rejects ABCD and AD");
    }

    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
