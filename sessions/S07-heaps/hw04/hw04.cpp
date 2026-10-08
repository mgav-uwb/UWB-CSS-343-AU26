// CSS 343 - Homework 4: heaps, priority queues, and balanced-tree invariants.
// Fill in the TODOs, then run the program.
//
//   build:       g++ -std=c++17 -O2 hw04.cpp -o hw04
//   run:         ./hw04
//
// Everything marked GIVEN, and main() (a unit-test battery), must not be
// edited. You implement the six TODOs. Each applies an idea from Lectures 6
// and 7 to a case the slides do not work out: read each contract carefully.

#include <iostream>
#include <vector>
#include <queue>
#include <functional>
#include <algorithm>
using namespace std;

// ============================================================================
// Part A - d-ary heaps (Lecture 7)
// ============================================================================
// A d-ary max-heap stores a complete d-ary tree in a vector, 0-BASED: the
// children of index i are d*i + 1, d*i + 2, ..., d*i + d (those that are < n),
// and the parent of j > 0 is (j - 1) / d. Every parent is >= each of its
// children. d = 2 is the binary heap, written 0-based.

// ---- TODO 1: sinkDary -------------------------------------------------------
// Sink a[i] within a[0..n-1]: while a[i] is smaller than its LARGEST child,
// swap it with that child and continue from there. If several children tie for
// the largest, use the LEFTMOST of them. (The tests compare against exactly
// this rule.) d >= 2.
void sinkDary(vector<int>& a, int i, int n, int d) {
    // TODO 1
}

// ---- TODO 2: buildDary --------------------------------------------------------
// Rearrange all of a into a d-ary max-heap in linear time: sink every
// internal node, from the last one back to the root, using sinkDary.
void buildDary(vector<int>& a, int d) {
    // TODO 2
}

// ============================================================================
// Part B - using a priority queue (Lecture 7)
// ============================================================================
// For these two you may use std::priority_queue. A MIN-heap of ints is
//     priority_queue<int, vector<int>, greater<int>> pq;
// and pq.top() is then its smallest element.

// ---- TODO 3: kthLargest ---------------------------------------------------------
// The k-th largest value in a (1 <= k <= a.size(); values may repeat, and the
// 1st largest is the maximum). Do NOT sort a: keep a min-heap of the k largest
// values seen so far, so the work is about n log k and the heap never holds more
// than k values.
int kthLargest(const vector<int>& a, int k) {
    // TODO 3
    return 0;
}

// ---- TODO 4: mergeSorted ----------------------------------------------------------
// Each lists[j] is sorted ascending. Return one ascending vector holding every
// element of every list (repeats kept). With L elements in all and k lists, use
// a min-heap holding at most one entry per list, so the work is about L log k.
// (Hint: an entry can be a pair or a small struct: value, which list, position.)
vector<int> mergeSorted(const vector<vector<int>>& lists) {
    // TODO 4
    return {};
}

// ============================================================================
// Part C - balanced-tree invariants (Lecture 6)
// ============================================================================

// GIVEN: a left-leaning red-black node. `red` is the color of the link from the
// node's parent to it (the root's flag is ignored).
struct RB {
    int  key;
    bool red;
    RB*  left;
    RB*  right;
};

// ---- TODO 5: llrbBlackHeight -----------------------------------------------------
// Check the left-leaning red-black invariants below t, and return t's black
// height, or -1 if any invariant fails:
//   1. no node has a RED RIGHT child;
//   2. no red node has a red left child (two reds in a row);
//   3. every path from t down to a null link passes the same number of BLACK
//      nodes (not counting t itself if t is red).
// Black height: the null link has black height 0; a node adds 1 to its
// children's black height if it is black, 0 if it is red. The BST ordering is
// not checked.
int llrbBlackHeight(const RB* t) {
    // TODO 5
    return -1;
}

// ---- TODO 6: minKeysBTree ------------------------------------------------------------
// The smallest number of keys a B-tree of order M (at most M children per node)
// can hold when its height is h (the root at depth 0, every leaf at depth h).
// The rules: the root holds at least 1 key; every other node has at least
// ceil(M/2) children if it is internal and at least ceil(M/2) - 1 keys.
// M >= 3, h >= 0. (A 2-3 tree is the case M = 3.)
long long minKeysBTree(int M, int h) {
    // TODO 6
    return 0;
}

// ============================================================================
// GIVEN: the unit-test battery. Do not edit below this line.
// ============================================================================
#ifndef HW04_GRADER
static int passCnt = 0, failCnt = 0;
static void check(bool ok, const char* what) {
    cout << (ok ? "  [PASS] " : "  [FAIL] ") << what << "\n";
    (ok ? passCnt : failCnt)++;
}
static bool isDaryHeap(const vector<int>& a, int d) {
    for (size_t j = 1; j < a.size(); j++) if (a[(j - 1) / d] < a[j]) return false;
    return true;
}
static RB* rb(int k, bool red, RB* l = nullptr, RB* r = nullptr) { return new RB{k, red, l, r}; }
static void freeRB(RB* t) { if (!t) return; freeRB(t->left); freeRB(t->right); delete t; }

int main() {
    cout << "T1 - sinkDary\n";
    {
        vector<int> a = {1, 9, 8, 7, 6, 5, 4};             // binary: root 1 sinks via 9
        sinkDary(a, 0, 7, 2);
        check(a == vector<int>({9, 7, 8, 1, 6, 5, 4}), "binary heap: 1 sinks past 9 then 7");
        vector<int> b = {2, 5, 9, 7, 1, 1, 1, 1};          // ternary: children of 0 are 1, 2, 3
        sinkDary(b, 0, 8, 3);
        check(b == vector<int>({9, 5, 2, 7, 1, 1, 1, 1}), "ternary heap: 2 swaps with the largest of three children, 9");
        vector<int> c = {3, 8, 8, 8};                      // ties: the leftmost child
        sinkDary(c, 0, 4, 3);
        check(c == vector<int>({8, 3, 8, 8}), "a tie among children goes to the leftmost");
        vector<int> e = {9, 1, 2};
        sinkDary(e, 0, 3, 2);
        check(e == vector<int>({9, 1, 2}), "a node already larger than its children stays");
    }

    cout << "T2 - buildDary\n";
    {
        vector<int> a = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        buildDary(a, 2);
        check(isDaryHeap(a, 2) && a[0] == 10, "1..10 into a binary heap: valid, maximum at the root");
        vector<int> b = {5, 3, 17, 10, 84, 19, 6, 22, 9, 1, 30, 2, 44};
        vector<int> sb = b; sort(sb.begin(), sb.end());
        buildDary(b, 4);
        vector<int> sb2 = b; sort(sb2.begin(), sb2.end());
        check(isDaryHeap(b, 4) && b[0] == 84 && sb == sb2, "13 keys into a 4-ary heap: valid, the same keys");
        vector<int> one = {7}, none;
        buildDary(one, 3); buildDary(none, 3);
        check(one == vector<int>({7}) && none.empty(), "one element and no elements");
    }

    cout << "T3 - kthLargest\n";
    {
        vector<int> a = {7, 2, 9, 4, 9, 1, 5};
        check(kthLargest(a, 1) == 9 && kthLargest(a, 2) == 9 && kthLargest(a, 3) == 7,
              "1st, 2nd, 3rd largest of 7 2 9 4 9 1 5: 9, 9, 7 (repeats count)");
        check(kthLargest(a, 7) == 1, "the 7th largest of 7 values is the minimum");
        vector<int> big;
        for (int i = 0; i < 1000000; i++) big.push_back((int)((i * 7919LL) % 1000000));   // 0..999999, shuffled
        check(kthLargest(big, 10) == 999990, "the 10th largest of 0..999999 shuffled is 999990");
    }

    cout << "T4 - mergeSorted\n";
    {
        vector<vector<int>> ls = {{1, 4, 9}, {2, 3, 10, 11}, {}, {4, 5}};
        check(mergeSorted(ls) == vector<int>({1, 2, 3, 4, 4, 5, 9, 10, 11}), "four lists, one empty, a repeat kept");
        check(mergeSorted({}).empty() && mergeSorted({{}, {}}).empty(), "no lists, and only empty lists");
        check(mergeSorted({{-3, 0, 8}}) == vector<int>({-3, 0, 8}), "a single list comes back unchanged");
    }

    cout << "T5 - llrbBlackHeight\n";
    {
        //      20 (black)
        //     /   \
        //   10r    30        10 red (left), all others black
        //   / \
        //  5   15
        RB* t = rb(20, false, rb(10, true, rb(5, false), rb(15, false)), rb(30, false));
        check(llrbBlackHeight(t) == 2, "a valid tree: black height 2");
        check(llrbBlackHeight(nullptr) == 0, "the empty tree has black height 0");
        RB* r = rb(20, false, rb(10, false), rb(30, true));
        check(llrbBlackHeight(r) == -1, "a red RIGHT child is invalid");
        RB* two = rb(20, false, rb(10, true, rb(5, true), nullptr), nullptr);   // every path has 1 black node
        check(llrbBlackHeight(two) == -1, "two reds in a row are invalid, even with black balance intact");
        RB* lop = rb(20, false, rb(10, false, rb(5, false), nullptr), rb(30, false));
        check(llrbBlackHeight(lop) == -1, "unequal black heights are invalid");
        freeRB(t); freeRB(r); freeRB(two); freeRB(lop);
    }

    cout << "T6 - minKeysBTree\n";
    {
        check(minKeysBTree(3, 0) == 1 && minKeysBTree(3, 2) == 7, "order 3 (a 2-3 tree): 1 key at height 0, 7 at height 2");
        check(minKeysBTree(5, 1) == 5, "order 5, height 1: a root of 1 key over two leaves of 2");
        check(minKeysBTree(256, 3) > 4000000, "order 256, height 3: over four million keys");
    }

    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
