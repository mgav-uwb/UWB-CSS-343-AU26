// CSS 343 · Homework 6: directed graphs and shortest paths.
// Fill in the TODOs, then run the program.
//
//   build:       g++ -std=c++17 -O2 hw06.cpp -o hw06
//   run:         ./hw06
//
// Everything marked GIVEN, and main() (a unit-test battery), must not be
// edited. You implement the five TODOs. Each applies an idea from Lectures 10
// and 11 to a case the slides do not work out: read each contract carefully.
//
// Graphs are adjacency lists over vertices 0..V-1 (V = adj.size()). An
// unweighted digraph is vector<vector<int>>: adj[u] lists every v with an edge
// u -> v. A weighted digraph is vector<vector<pair<int,int>>>: adj[u] holds a
// pair (v, w) for every edge u -> v of weight w. Graphs may have self-loops
// and repeated edges. V can be 100,000 and E can be 1,000,000.

#include <iostream>
#include <vector>
#include <queue>
#include <stack>
#include <climits>
#include <algorithm>
#include <functional>
using namespace std;

// ============================================================================
// Part A · depth-first search on digraphs (Lecture 10)
// ============================================================================

// ---- TODO 1: hasCycle ----------------------------------------------------------
// true if the digraph has a directed cycle (a self-loop counts). Use the three
// colors: white = not yet discovered, gray = discovered but not finished,
// black = finished. An edge u -> v examined while v is gray is a back edge,
// and a digraph has a cycle exactly when some DFS finds a back edge. Restart
// the search at every vertex that is still white.
bool hasCycle(const vector<vector<int>>& adj) {
    // TODO 1
    return false;
}

// ---- TODO 2: topoOrderMin ---------------------------------------------------------
// A topological order by Kahn's algorithm, with one extra rule: whenever several
// vertices have in-degree 0, output the SMALLEST one first. (Keep the ready
// vertices in a min-heap: priority_queue<int, vector<int>, greater<int>>.)
// Return the order as a vector of all V vertices, or an EMPTY vector if the
// digraph has a cycle. The work must be about (V + E) log V: never rescan all
// vertices to find the next one.
vector<int> topoOrderMin(const vector<vector<int>>& adj) {
    // TODO 2
    return {};
}

// ---- TODO 3: sccLabels --------------------------------------------------------------
// Label the strongly connected components: return comp with comp[u] == comp[v]
// exactly when u and v are in the same strongly connected component. The label
// values themselves are yours to choose. Use Kosaraju's two passes:
//   1. DFS over the whole digraph G (restart at every unvisited vertex),
//      recording each vertex as it FINISHES (its post-order);
//   2. build the transpose G^T (every edge reversed); DFS over G^T, taking
//      start vertices in REVERSE post-order; each restart finds one component.
// The work must be about V + E.
vector<int> sccLabels(const vector<vector<int>>& adj) {
    // TODO 3
    return vector<int>(adj.size(), 0);
}

// ============================================================================
// Part B · shortest paths (Lecture 11)
// ============================================================================
const long long UNREACHABLE = LLONG_MAX;

// ---- TODO 4: dijkstra --------------------------------------------------------------
// Every weight is >= 0. Return dist, where dist[v] is the weight of a shortest
// path from s to v (dist[s] = 0), or UNREACHABLE. Use a priority_queue of
// (distance, vertex) pairs with lazy deletion: skip a popped entry whose
// distance is larger than the vertex's current dist. Distances can exceed the
// range of int: add in long long. The work must be about E log V.
vector<long long> dijkstra(const vector<vector<pair<int,int>>>& adj, int s) {
    // TODO 4
    return vector<long long>(adj.size(), UNREACHABLE);
}

// ---- TODO 5: dagShortest ------------------------------------------------------------
// adj is ACYCLIC, and weights may be NEGATIVE. Dijkstra's correctness argument
// needs nonnegative weights, so do not call dijkstra here. Return dist with the
// same meaning as in TODO 4 (UNREACHABLE included). Relax the out-edges of
// every vertex in a topological order (you may call your topoOrderMin): by the
// time a vertex's turn comes, every path into it has been relaxed, so its dist
// is final. Never relax an edge out of a vertex whose dist is still UNREACHABLE.
// The work must be about V + E (plus the topological sort): our grading tests include a
// graph on which a priority-queue search revisits vertices over and over.
vector<long long> dagShortest(const vector<vector<pair<int,int>>>& adj, int s) {
    // TODO 5
    return vector<long long>(adj.size(), UNREACHABLE);
}

// ============================================================================
// GIVEN: the unit-test battery. Do not edit below this line.
// ============================================================================
#ifndef HW06_GRADER
static int passCnt = 0, failCnt = 0;
static void check(bool ok, const char* what) {
    cout << (ok ? "  [PASS] " : "  [FAIL] ") << what << "\n";
    (ok ? passCnt : failCnt)++;
}
static bool samePartition(const vector<int>& a, const vector<int>& b) {
    if (a.size() != b.size()) return false;
    for (size_t i = 0; i < a.size(); i++)
        for (size_t j = 0; j < a.size(); j++)
            if ((a[i] == a[j]) != (b[i] == b[j])) return false;
    return true;
}
static const long long U = UNREACHABLE;

int main() {
    // the course DAG: 0->1, 0->3, 1->2, 1->3, 2->3, 0->5, 3->4, 3->7, 4->5, 5->6, 4->7
    vector<vector<int>> dag = {{1, 3, 5}, {2, 3}, {3}, {4, 7}, {5, 7}, {6}, {}, {}};

    cout << "T1 · hasCycle\n";
    {
        check(!hasCycle(dag), "the course DAG has no cycle");
        vector<vector<int>> cyc = dag; cyc[6].push_back(2);          // 2->3->4->5->6->2
        check(hasCycle(cyc), "adding 6 -> 2 closes the cycle 2 3 4 5 6");
        vector<vector<int>> loop = {{1}, {1}};                        // a self-loop at 1
        vector<vector<int>> diamond = {{1, 2}, {3}, {3}, {}};         // two paths into 3: no cycle
        check(hasCycle(loop) && !hasCycle(diamond), "a self-loop is a cycle; a diamond is not");
    }

    cout << "T2 · topoOrderMin\n";
    {
        check(topoOrderMin(dag) == vector<int>({0, 1, 2, 3, 4, 5, 6, 7}), "the course DAG: 0 1 2 3 4 5 6 7");
        vector<vector<int>> g = {{}, {0}, {0}, {1, 2}, {}};            // 3->1, 3->2, 1->0, 2->0
        check(topoOrderMin(g) == vector<int>({3, 1, 2, 0, 4}), "smallest ready vertex first: 3 1 2 0 4");
        vector<vector<int>> cyc = dag; cyc[6].push_back(2);
        check(topoOrderMin(cyc).empty(), "a digraph with a cycle gives an empty order");
    }

    cout << "T3 · sccLabels\n";
    {
        //  0 <-> 1 -> 2 -> 3 -> 4 -> 2,  4 -> 5,  5 -> 5
        vector<vector<int>> g = {{1}, {0, 2}, {3}, {4}, {2, 5}, {5}};
        check(samePartition(sccLabels(g), {0, 0, 1, 1, 1, 2}), "components {0,1}, {2,3,4}, {5}");
        check(samePartition(sccLabels(dag), {0, 1, 2, 3, 4, 5, 6, 7}), "in a DAG every vertex is its own component");
        vector<vector<int>> ring(6);
        for (int i = 0; i < 6; i++) ring[i].push_back((i + 1) % 6);
        check(samePartition(sccLabels(ring), {0, 0, 0, 0, 0, 0}), "a directed ring is one component");
    }

    // the course graph, weighted: 0->1 4, 0->3 6, 1->2 1, 1->3 5, 2->3 8, 0->5 20,
    // 3->4 2, 3->7 11, 4->5 3, 5->6 9, 4->7 7
    vector<vector<pair<int,int>>> w = {{{1, 4}, {3, 6}, {5, 20}}, {{2, 1}, {3, 5}}, {{3, 8}},
                                       {{4, 2}, {7, 11}}, {{5, 3}, {7, 7}}, {{6, 9}}, {}, {}};

    cout << "T4 · dijkstra\n";
    {
        check(dijkstra(w, 0) == vector<long long>({0, 4, 5, 6, 8, 11, 20, 15}), "from 0: 0 4 5 6 8 11 20 15 (vertex 5 by the detour 0 3 4 5, not the edge 0 5)");
        check(dijkstra(w, 3) == vector<long long>({U, U, U, 0, 2, 5, 14, 9}), "from 3: vertices 0, 1, 2 are unreachable");
        vector<vector<pair<int,int>>> big = {{{1, 2000000000}}, {{2, 2000000000}}, {}};
        check(dijkstra(big, 0)[2] == 4000000000LL, "distances beyond the range of int");
    }

    cout << "T5 · dagShortest\n";
    {
        check(dagShortest(w, 0) == dijkstra(w, 0), "on the weighted course DAG it agrees with Dijkstra");
        vector<vector<pair<int,int>>> neg = {{{1, 5}, {2, 2}}, {{3, -4}}, {{3, 1}}, {}};   // 0 1 3 costs 1
        check(dagShortest(neg, 0) == vector<long long>({0, 5, 2, 1}), "a negative edge: 0 1 3 costs 1, cheaper than 0 2 3");
        vector<vector<pair<int,int>>> un = {{}, {{2, -7}}, {}};                          // 1 is unreachable from 0
        check(dagShortest(un, 0) == vector<long long>({0, U, U}), "an edge out of an unreachable vertex is never relaxed");
    }

    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
