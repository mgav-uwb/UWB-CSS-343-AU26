// CSS 343 · PA2: Part 4 race harness (GIVEN, apart from the marked paste).
// Times all-pairs shortest paths two ways on one graph file:
//   (a) your GraphM::findShortestPath()   (linear-scan Dijkstra from every source)
//   (b) your Homework 6 dijkstra, called once per source
// and checks that both agree (the sum of every finite distance).
//
//   g++ -std=c++17 -O2 race.cpp graphm.cpp -o race
//   ./race dense_400.txt
//
// Measure with -O2. Paste your Homework 6 dijkstra where marked, unchanged.
#include "graphm.h"
#include <chrono>
#include <climits>
#include <queue>
#include <sstream>
#include <utility>
#include <vector>
using namespace std;

// ---- PASTE your Homework 6 dijkstra here (same signature) -------------------
vector<long long> dijkstra(const vector<vector<pair<int,int>>>& adj, int s) {
    vector<long long> dist(adj.size(), LLONG_MAX);
    (void)s;
    return dist;
}
// -----------------------------------------------------------------------------

// Read the first graph of the file into an adjacency list. Vertices keep
// their 1-based ids (vertex 0 has no edges); a repeated edge keeps its LAST
// weight, the same rule as the matrix.
static vector<vector<pair<int,int>>> readList(const string& name) {
    ifstream f(name);
    int n; f >> n; f.ignore();
    string line;
    for (int i = 1; i <= n; i++) getline(f, line);
    vector<vector<pair<int,int>>> raw(n + 1);
    int u, v, w;
    while (f >> u && u != 0 && f >> v >> w) raw[u].push_back({v, w});
    vector<vector<pair<int,int>>> adj(n + 1);
    vector<int> seen(n + 1, 0);
    for (int a = 1; a <= n; a++) {
        for (int i = (int)raw[a].size() - 1; i >= 0; i--)        // last one wins
            if (seen[raw[a][i].first] != a) { seen[raw[a][i].first] = a; adj[a].push_back(raw[a][i]); }
    }
    return adj;
}

int main(int argc, char** argv) {
    if (argc < 2) { cerr << "usage: ./race graph.txt\n"; return 1; }
    using clk = chrono::steady_clock;
    auto ms = [](clk::time_point a, clk::time_point b) { return chrono::duration<double, milli>(b - a).count(); };

    ifstream f(argv[1]);
    GraphM g;
    if (g.buildGraph(f) != 1) { cerr << "could not read " << argv[1] << "\n"; return 1; }
    int n = g.getSize();
    auto t0 = clk::now();
    g.findShortestPath();
    auto t1 = clk::now();
    long long sumM = 0;
    for (int s = 1; s <= n; s++)
        for (int t = 1; t <= n; t++)
            if (g.getDist(s, t) != INF) sumM += g.getDist(s, t);

    auto adj = readList(argv[1]);
    long long edges = 0;
    for (auto& a : adj) edges += (long long)a.size();
    auto t2 = clk::now();
    long long sumH = 0;
    for (int s = 1; s <= n; s++) {
        vector<long long> d = dijkstra(adj, s);
        for (int t = 1; t <= n; t++) if (d[t] != LLONG_MAX) sumH += d[t];
    }
    auto t3 = clk::now();

    cout << argv[1] << ": V = " << n << ", E = " << edges << "\n";
    cout << "  GraphM linear scan, all pairs: " << ms(t0, t1) << " ms\n";
    cout << "  heap dijkstra x V sources:     " << ms(t2, t3) << " ms\n";
    cout << "  distance sums " << (sumM == sumH ? "agree" : "DIFFER: fix one of the two before measuring")
         << " (" << sumM << ")\n";
    return 0;
}
