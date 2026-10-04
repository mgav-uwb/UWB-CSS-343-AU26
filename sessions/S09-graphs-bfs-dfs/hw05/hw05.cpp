// CSS 343 · Homework 5: hash tables and graph search.
// Fill in the TODOs, then run the program.
//
//   build:       g++ -std=c++17 -O2 hw05.cpp -o hw05
//   run:         ./hw05
//
// Everything marked GIVEN, and main() (a unit-test battery), must not be
// edited. You implement the six TODOs. Each applies an idea from Lectures 8
// and 9 to a case the slides do not work out: read each contract carefully.

#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <stack>
#include <climits>
#include <algorithm>
using namespace std;

// ============================================================================
// Part A · open addressing (Lecture 8)
// ============================================================================
// GIVEN: a fixed-size open-addressing table of non-negative int keys. slot[i]
// holds a key, or EMPTY. The table never resizes. M is prime.
const int EMPTY = -1;
struct OATable {
    int M;                   // number of slots
    int n = 0;               // number of keys stored
    vector<int> slot;        // slot[0..M-1]
    explicit OATable(int m) : M(m), slot(m, EMPTY) {}
};

// ---- TODO 1: dhInsert ---------------------------------------------------------
// Insert k (k >= 0) by DOUBLE HASHING with
//     h(k)  = k mod M
//     h2(k) = Q - (k mod Q)          (Q is a prime smaller than M, so h2 is 1..Q)
// Probe the slots (h(k) + i * h2(k)) mod M for i = 0, 1, 2, ..., M - 1:
//   - a slot holding k already: return its index (no duplicate is stored);
//   - the first EMPTY slot: store k there, add 1 to n, return the index;
//   - all M probes fail: return -1 (the table is unchanged).
int dhInsert(OATable& t, int k, int Q) {
    // TODO 1
    return -1;
}

// GIVEN: linear probing with h(k) = k mod M. lpInsert returns false when the
// table is full; lpContains stops at the first EMPTY slot.
bool lpInsert(OATable& t, int k) {
    int i = k % t.M;
    for (int probes = 0; probes < t.M; probes++, i = (i + 1) % t.M) {
        if (t.slot[i] == k) return true;
        if (t.slot[i] == EMPTY) { t.slot[i] = k; t.n++; return true; }
    }
    return false;
}
bool lpContains(const OATable& t, int k) {
    int i = k % t.M;
    for (int probes = 0; probes < t.M; probes++, i = (i + 1) % t.M) {
        if (t.slot[i] == EMPTY) return false;
        if (t.slot[i] == k) return true;
    }
    return false;
}

// ---- TODO 2: lpRemove -----------------------------------------------------------
// Remove k from a LINEAR-probing table (filled by lpInsert) and return true, or
// return false if k is absent. Use the re-insert repair from the slides: empty
// k's slot, then walk forward (wrapping past M - 1 to 0) through the rest of the
// cluster, up to the first EMPTY slot; take out each key you pass and insert it
// again with lpInsert BEFORE moving on to the next slot. After the call every
// remaining key must still be found by lpContains, and n must be correct.
bool lpRemove(OATable& t, int k) {
    // TODO 2
    return false;
}

// ============================================================================
// Part B · separate chaining with resizing (Lecture 8)
// ============================================================================
// GIVEN: a chaining table of non-negative int keys, h(k) = k mod M.
struct ChainTable {
    int M;
    int n = 0;
    vector<vector<int>> bucket;   // bucket[i] is the chain of slot i, front to back
    explicit ChainTable(int m) : M(m), bucket(m) {}
};

// ---- TODO 3: chainInsert -----------------------------------------------------------
// Insert k: if k is already in its chain, do nothing and return false.
// Otherwise append k to the END of chain k mod M, add 1 to n, and then, if the
// load factor n / M is now GREATER than 2, resize: the new size is 2M + 1, and
// the keys are rehashed by walking the old chains 0, 1, ..., M - 1, each from
// front to back, appending every key to the end of its new chain. Return true.
bool chainInsert(ChainTable& t, int k) {
    // TODO 3
    return false;
}

// ============================================================================
// Part C · graph search (Lecture 9)
// ============================================================================
// Graphs are adjacency lists: adj[u] lists the neighbors of vertex u, for
// vertices 0..V-1 (V = adj.size()). An undirected graph lists each edge in
// both directions.

// ---- TODO 4: componentSizes ------------------------------------------------------
// adj is UNDIRECTED. Return the number of vertices in each connected component,
// listing the components in increasing order of their SMALLEST vertex. For
// example, with components {0, 3}, {1}, {2, 4, 5}, return {2, 1, 3}.
// V can be 200,000 and a component can be a path through all of them.
vector<int> componentSizes(const vector<vector<int>>& adj) {
    // TODO 4
    return {};
}

// ---- TODO 5: gridSteps --------------------------------------------------------------
// grid is a rectangle of characters: '#' is a wall, every other cell is open;
// exactly one cell is 'S' and exactly one is 'E'. A move goes to one of the
// four neighbors (up, down, left, right) that is open and inside the grid.
// Return the fewest moves from S to E, or -1 if E cannot be reached.
int gridSteps(const vector<string>& grid) {
    // TODO 5
    return -2;
}

// ---- TODO 6: bfsPath -------------------------------------------------------------------
// adj may be DIRECTED. Return a path from s to t with the fewest edges, as the
// list of its vertices from s to t (both included). Return {s} if s == t, and
// an empty vector if t cannot be reached from s. When several shortest paths
// exist, any one of them is accepted.
vector<int> bfsPath(const vector<vector<int>>& adj, int s, int t) {
    // TODO 6
    return {};
}

// ============================================================================
// GIVEN: the unit-test battery. Do not edit below this line.
// ============================================================================
#ifndef HW05_GRADER
static int passCnt = 0, failCnt = 0;
static void check(bool ok, const char* what) {
    cout << (ok ? "  [PASS] " : "  [FAIL] ") << what << "\n";
    (ok ? passCnt : failCnt)++;
}
static vector<vector<int>> undirected(int V, const vector<pair<int,int>>& es) {
    vector<vector<int>> adj(V);
    for (auto [u, v] : es) { adj[u].push_back(v); adj[v].push_back(u); }
    return adj;
}
static bool isPath(const vector<vector<int>>& adj, const vector<int>& p, int s, int t) {
    if (p.empty() || p.front() != s || p.back() != t) return false;
    for (size_t i = 0; i + 1 < p.size(); i++)
        if (find(adj[p[i]].begin(), adj[p[i]].end(), p[i + 1]) == adj[p[i]].end()) return false;
    return true;
}

int main() {
    cout << "T1 · dhInsert\n";
    {
        OATable t(11);                                    // the slides' example: Q = 7
        int a = dhInsert(t, 89, 7), b = dhInsert(t, 18, 7), c = dhInsert(t, 40, 7), d = dhInsert(t, 29, 7);
        check(a == 1 && b == 7 && c == 9 && d == 2, "89, 18, 40, 29 into M = 11, Q = 7 land in slots 1, 7, 9, 2");
        check(dhInsert(t, 40, 7) == 9 && t.n == 4, "inserting 40 again returns its slot and stores nothing");
        OATable f(5);
        for (int k : {0, 5, 10, 15, 20}) dhInsert(f, k, 3);
        check(f.n == 5 && dhInsert(f, 25, 3) == -1, "a full table rejects a new key with -1");
    }

    cout << "T2 · lpRemove\n";
    {
        OATable t(11);
        for (int k : {14, 25, 36}) lpInsert(t, k);        // all home to 3: slots 3, 4, 5
        check(lpRemove(t, 14) && t.slot[3] == 25 && t.slot[4] == 36 && t.slot[5] == EMPTY && t.n == 2,
              "remove 14 from the cluster 14 25 36: 25 and 36 move home");
        check(!lpRemove(t, 99) && t.n == 2, "removing an absent key returns false");
        OATable w(7);
        for (int k : {6, 13, 20, 1}) lpInsert(w, k);      // 6, 13, 20 home to 6 and wrap to 0, 1; 1 probes to 2
        bool ok = lpRemove(w, 13) && lpContains(w, 6) && lpContains(w, 20) && lpContains(w, 1) && !lpContains(w, 13) && w.n == 3;
        check(ok, "a cluster that wraps past the last slot is repaired");
    }

    cout << "T3 · chainInsert\n";
    {
        ChainTable t(3);
        for (int k : {1, 4, 7, 2, 5, 8}) chainInsert(t, k);    // n = 6 = 2M: no resize yet
        check(t.M == 3 && t.bucket[1] == vector<int>({1, 4, 7}), "six keys in M = 3: load factor 2, no resize");
        check(!chainInsert(t, 4) && t.n == 6, "a duplicate is not stored");
        chainInsert(t, 0);                                       // n = 7 > 2M: resize to 7
        bool ok = t.M == 7 && t.n == 7 && t.bucket[1] == vector<int>({1, 8}) && t.bucket[0] == vector<int>({0, 7});
        check(ok, "the seventh key resizes to M = 7 and rehashes in chain order");
    }

    cout << "T4 · componentSizes\n";
    {
        auto g = undirected(6, {{0, 3}, {2, 4}, {4, 5}});
        check(componentSizes(g) == vector<int>({2, 1, 3}), "components {0,3}, {1}, {2,4,5}: sizes 2, 1, 3");
        check(componentSizes(vector<vector<int>>(4)) == vector<int>({1, 1, 1, 1}), "four isolated vertices");
        vector<pair<int,int>> es;
        for (int i = 0; i + 1 < 200000; i++) es.push_back({i, i + 1});
        check(componentSizes(undirected(200000, es)) == vector<int>({200000}), "a path through 200,000 vertices is one component");
    }

    cout << "T5 · gridSteps\n";
    {
        vector<string> g = {"..#.",
                            "S.#.",
                            "...E"};
        check(gridSteps(g) == 4, "the slides' maze: 4 moves");
        vector<string> h = {"S#E"};
        check(gridSteps(h) == -1, "a wall between S and E: -1");
        vector<string> u = {"S...",
                            "###.",
                            "E...",};
        check(gridSteps(u) == 8, "a U-shaped corridor: 8 moves");
        vector<string> room = {"S...",
                               "....",
                               ".E.."};
        check(gridSteps(room) == 3, "an open room: 3 moves");
    }

    cout << "T6 · bfsPath\n";
    {
        //  0 -> 1 -> 2 -> 3,  0 -> 4 -> 3,  3 -> 5
        vector<vector<int>> g = {{1, 4}, {2}, {3}, {5}, {3}, {}};
        vector<int> p = bfsPath(g, 0, 5);
        check(p == vector<int>({0, 4, 3, 5}), "0 to 5: the shorter route through 4");
        check(bfsPath(g, 2, 2) == vector<int>({2}) && bfsPath(g, 5, 0).empty(), "s == t, and an unreachable target");
        auto u = undirected(5, {{0, 1}, {1, 2}, {0, 3}, {3, 2}, {2, 4}});
        vector<int> q = bfsPath(u, 0, 4);
        check(q.size() == 4 && isPath(u, q, 0, 4), "an undirected graph with two shortest routes: either is accepted");
    }

    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
