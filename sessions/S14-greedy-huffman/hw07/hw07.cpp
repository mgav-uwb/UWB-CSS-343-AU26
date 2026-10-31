// CSS 343 - Homework 7: spanning trees and greedy algorithms.
// Fill in the TODOs, then run the program.
//
//   build:       g++ -std=c++17 -O2 hw07.cpp -o hw07
//   run:         ./hw07
//
// Everything marked GIVEN, and main() (a unit-test battery), must not be
// edited. You implement the six TODOs. Each applies an idea from Lectures 13
// and 14 to a case the slides do not work out: read each contract carefully.
//
// Graphs here are UNDIRECTED and weighted, on vertices 0..V-1. Kruskal takes
// an edge list (vector<Edge>). Prim takes adjacency lists,
// vector<vector<pair<int,int>>>, in which an edge u-v of weight w appears
// twice: as (v, w) in adj[u] and as (u, w) in adj[v]. Graphs may have
// self-loops and repeated edges. V can be 100,000 and E can be 1,000,000.

#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>
#include <functional>
using namespace std;

// ============================================================================
// Part A - union-find (Lecture 13)
// ============================================================================

// GIVEN: a partition of 0..n-1 into disjoint sets. Each set is a tree of
// parent pointers whose root is the set's representative (a root is its own
// parent). size[r] is the number of elements in r's tree; it is kept up to
// date for roots only.
struct UF {
    vector<int> parent, size;
    UF(int n) : parent(n), size(n, 1) {
        for (int i = 0; i < n; i++) parent[i] = i;   // n singleton sets
    }
};

// ---- TODO 1: find -------------------------------------------------------------
// Return the root of x's tree, compressing the path on the way: either path
// halving (point each node you pass at its grandparent, in one pass up) or
// full compression (point every node you pass at the root). After find(uf, x),
// x must be closer to the root than before whenever it was 2 or more levels
// below it. Compression never changes which element is the root.
int find(UF& uf, int x) {
    // TODO 1
    return x;
}

// GIVEN: uses your find.
bool connected(UF& uf, int a, int b) { return find(uf, a) == find(uf, b); }

// ---- TODO 2: unite ------------------------------------------------------------
// Union by size. Find both roots; if they are the same, change nothing and
// return false. Otherwise hang the root of the SMALLER set under the root of
// the larger one, add the sizes, and return true. On a TIE, b's root goes
// under a's root: the first argument's root survives.
//   Example: from singletons, unite(4,3) makes 4 the root of {3,4}, and
//   unite(2,1) makes 2 the root of {1,2}. Then unite(1,3) finds the roots 2
//   and 4, both of size 2: a tie, so 4 goes under 2, and size[2] becomes 4.
bool unite(UF& uf, int a, int b) {
    // TODO 2
    return false;
}

// ============================================================================
// Part B - minimum spanning trees (Lecture 13)
// ============================================================================
struct Edge { int u, v, w; };                    // the undirected edge u-v, weight w

// GIVEN: the order Kruskal sorts by:  sort(edges.begin(), edges.end(), lighter);
bool lighter(const Edge& a, const Edge& b) { return a.w < b.w; }

// ---- TODO 3: kruskal ----------------------------------------------------------
// Return the edges of a minimum spanning forest, in the order Kruskal ACCEPTS
// them. Sort the edges by weight (ties in any order); then accept each edge
// whose endpoints are not yet connected, using your union-find for both the
// test and the merge. On a connected graph that is V-1 edges, and you may
// stop as soon as you have them. On a disconnected graph it is one minimum
// spanning tree per component: V - c edges in all for c components. The work
// must be about E log E.
vector<Edge> kruskal(int V, vector<Edge> edges) {
    // TODO 3
    return {};
}

// ---- TODO 4: prim -------------------------------------------------------------
// Lazy Prim from s: return the total weight of a minimum spanning tree of the
// component that contains s (vertices s cannot reach are not part of it).
// Keep the candidate edges leaving the tree in a min-heap of (weight, vertex)
// pairs:
//     priority_queue<pair<long long,int>, vector<pair<long long,int>>,
//                    greater<pair<long long,int>>>
// Pop the lightest. If its vertex is already in the tree the entry is stale:
// skip it. Otherwise add the vertex and the weight, and push the vertex's
// edges to vertices still outside. Totals can exceed the range of int: add
// in long long. The work must be about E log V.
long long prim(const vector<vector<pair<int,int>>>& adj, int s) {
    // TODO 4
    return 0;
}

// ============================================================================
// Part C - greedy algorithms (Lecture 14)
// ============================================================================
struct Activity { int start, finish; };          // the half-open interval [start, finish)

// ---- TODO 5: maxActivities ----------------------------------------------------
// Choose as many activities as possible for one room, no two of them
// overlapping. Intervals are half-open, so [1,3) and [3,5) do not overlap.
// Every activity has start < finish. Use the earliest-finish rule: consider
// the activities in order of finish time (on equal finish times, the smaller
// index first) and take each one that starts at or after the finish of the
// last one taken. Return the indices of the activities taken, in the order
// taken. (Sorting a vector of (finish, index) pairs gives exactly this
// order.) The work must be about n log n.
vector<int> maxActivities(const vector<Activity>& acts) {
    // TODO 5
    return {};
}

// ---- TODO 6: huffmanCodes -----------------------------------------------------
// freq[i] > 0 is the frequency of symbol i. Return code, where code[i] is the
// codeword of symbol i in the Huffman tree built by exactly this rule:
//   - every node has an id: the leaves are 0..n-1 (symbol i is leaf i), and
//     each new internal node takes the next unused id: n, n+1, ...;
//   - a min-heap holds (frequency, id) pairs, so on equal frequencies the
//     smaller id comes out first;
//   - pop x, then pop y, and push a new node of frequency x + y whose LEFT
//     child is x and RIGHT child is y; repeat until one node is left.
// Read the codes off the tree: going left appends '0', going right '1'. A lone
// symbol gets the code "0"; no symbols give an empty vector. Store the tree in
// arrays indexed by id (left[id], right[id]): no new or delete is needed.
// Frequencies and their sums can exceed the range of int. The work must be
// about n log n.
//   Example: frequencies 1 1 2 2 give the codes 00 01 10 11.
vector<string> huffmanCodes(const vector<long long>& freq) {
    // TODO 6
    return vector<string>(freq.size(), "");
}

// ============================================================================
// GIVEN: the unit-test battery. Do not edit below this line.
// ============================================================================
#ifndef HW07_GRADER
static int passCnt = 0, failCnt = 0;
static void check(bool ok, const char* what) {
    cout << (ok ? "  [PASS] " : "  [FAIL] ") << what << "\n";
    (ok ? passCnt : failCnt)++;
}
static long long weightOf(const vector<Edge>& es) {
    long long t = 0;
    for (const Edge& e : es) t += e.w;
    return t;
}
// the undirected edge list as adjacency lists, each edge stored at both ends
static vector<vector<pair<int,int>>> lists(int V, const vector<Edge>& es) {
    vector<vector<pair<int,int>>> adj(V);
    for (const Edge& e : es) {
        adj[e.u].push_back({e.v, e.w});
        if (e.u != e.v) adj[e.v].push_back({e.u, e.w});
    }
    return adj;
}

int main() {
    cout << "T1 - find\n";
    {
        UF uf(6);
        for (int i = 1; i < 6; i++) uf.parent[i] = i - 1;      // the chain 5 -> 4 -> 3 -> 2 -> 1 -> 0
        int r = find(uf, 5);
        check(r == 0, "find(5) on the chain 5 4 3 2 1 0 returns the root 0");
        check(uf.parent[5] != 4 && uf.parent[0] == 0, "find(5) moved 5 closer to the root, and 0 is still the root");
        check(find(uf, 3) == 0 && find(uf, 0) == 0, "every node still reaches the root 0");
    }

    cout << "T2 - unite\n";
    {
        UF uf(10);
        bool a = unite(uf, 4, 3), b = unite(uf, 3, 8), c = unite(uf, 2, 1);
        check(a && b && c && uf.parent[3] == 4 && uf.parent[8] == 4 && uf.size[4] == 3,
              "unite(4,3), unite(3,8): a tie keeps 4, then 8 joins the larger set; size[4] = 3");
        check(unite(uf, 1, 8) && find(uf, 1) == 4 && uf.size[4] == 5,
              "unite(1,8): the smaller root 2 goes under 4, whatever the argument order; size[4] = 5");
        check(!unite(uf, 8, 1) && uf.size[4] == 5, "unite(8,1) on one set returns false and changes nothing");
    }

    // the running graph: 8 vertices, 11 edges, all weights distinct; its MST weighs 31
    vector<Edge> run = {{0, 1, 4}, {0, 3, 6}, {1, 2, 1}, {1, 3, 5}, {2, 3, 8}, {0, 5, 20},
                        {3, 4, 2}, {3, 7, 11}, {4, 5, 3}, {5, 6, 9}, {4, 7, 7}};
    // two components, {0,1,2} and {3,4}
    vector<Edge> split = {{0, 1, 1}, {1, 2, 2}, {0, 2, 4}, {3, 4, 3}};

    cout << "T3 - kruskal\n";
    {
        vector<Edge> t = kruskal(8, run);
        check(t.size() == 7 && weightOf(t) == 31, "the running graph: 7 edges, total 31");
        check(t.size() == 7 && t[0].w == 1 && t[1].w == 2 && t[6].w == 9,
              "accepted in weight order: 1, 2, ..., ending with 5-6 (9)");
        vector<Edge> f = kruskal(5, split);
        check(f.size() == 3 && weightOf(f) == 6, "two components: a spanning forest of 3 edges, total 6");
    }

    cout << "T4 - prim\n";
    {
        vector<vector<pair<int,int>>> adj = lists(8, run);
        check(prim(adj, 0) == 31 && prim(adj, 6) == 31, "the running graph from 0 and from 6: 31");
        vector<vector<pair<int,int>>> sp = lists(5, split);
        check(prim(sp, 0) == 3 && prim(sp, 4) == 3, "two components: from 0 the tree of {0,1,2} (3), from 4 that of {3,4} (3)");
        vector<Edge> big = {{0, 1, 2000000000}, {1, 2, 2000000000}};
        check(prim(lists(3, big), 0) == 4000000000LL, "totals beyond the range of int");
    }

    cout << "T5 - maxActivities\n";
    {
        //                         a       b       c       d       e
        vector<Activity> five = {{1, 5}, {2, 6}, {3, 7}, {7, 9}, {8, 11}};
        check(maxActivities(five) == vector<int>({0, 3}), "[1,5) [2,6) [3,7) [7,9) [8,11): takes a and d");
        vector<Activity> wide = {{0, 10}, {1, 2}, {3, 4}, {5, 6}};
        check(maxActivities(wide) == vector<int>({1, 2, 3}), "the long [0,10) loses to three short ones");
        vector<Activity> touch = {{4, 6}, {1, 3}, {6, 8}, {3, 6}};
        check(maxActivities(touch) == vector<int>({1, 0, 2}),
              "[1,3) [4,6) [6,8) touch but do not overlap; [3,6) ties [4,6) at finish 6 and loses on index");
    }

    cout << "T6 - huffmanCodes\n";
    {
        //                          a  b   c   d   e   f
        vector<long long> clrs = {5, 9, 12, 13, 16, 45};
        check(huffmanCodes(clrs) == vector<string>({"1100", "1101", "100", "101", "111", "0"}),
              "a:5 b:9 c:12 d:13 e:16 f:45 give 1100 1101 100 101 111 0 (224 bits in all)");
        check(huffmanCodes({1, 1, 2, 2}) == vector<string>({"00", "01", "10", "11"}),
              "1 1 2 2: ties go to the smaller id, so every code has 2 bits");
        check(huffmanCodes({7}) == vector<string>({"0"}) && huffmanCodes({}).empty(),
              "a lone symbol gets \"0\"; no symbols, no codes");
    }

    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
