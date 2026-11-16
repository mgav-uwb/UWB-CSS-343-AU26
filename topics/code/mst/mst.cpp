// CSS 343 · topics kruskal and prim: every C++ block on their slides, verbatim, compiled
// and run on the course graph. Prim's heap trace (the "Prim's heap, traced" table) is
// printed by an instrumented copy that must agree with the slide's code. Every number a
// slide quotes is asserted.
//
//   g++ -std=c++17 -Wall -Wextra -fsanitize=address,undefined -g mst.cpp -o mst && ./mst
#include <algorithm>
#include <cassert>
#include <climits>
#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>
using namespace std;

const int INF = INT_MAX;
const vector<vector<int>> COURSE = {{0, 1, 4}, {0, 3, 6}, {1, 2, 1}, {1, 3, 5}, {2, 3, 8}, {0, 5, 20},
                                    {3, 4, 2}, {3, 7, 11}, {4, 5, 3}, {5, 6, 9}, {4, 7, 7}};

// ---- union-find, as the Union-Find chapter gives it (weighted, path halving) -------
struct UF {
    vector<int> parent, size;
    UF(int n) : parent(n), size(n, 1) { for (int i = 0; i < n; i++) parent[i] = i; }
    int find(int x) {
        while (x != parent[x]) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) swap(ra, rb);
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    }
    bool connected(int a, int b) { return find(a) == find(b); }
};

// ---- slide "Kruskal: the code" ----------------------------------------------------
namespace kr {
struct Edge { int u, v, w; };
bool lighter(const Edge& a, const Edge& b) { return a.w < b.w; }

vector<Edge> kruskal(int V, vector<Edge> edges) {
    sort(edges.begin(), edges.end(), lighter);  // cheapest first
    UF uf(V);
    vector<Edge> mst;
    for (const Edge& e : edges) {
        if (uf.connected(e.u, e.v)) continue;   // a cycle: skip it
        mst.push_back(e);                       // safe: take it
        uf.unite(e.u, e.v);
        if ((int)mst.size() == V - 1) break;    // the tree is complete
    }
    return mst;
}
}  // namespace kr

// ---- slides "The entries and their order" and "Prim: the code" (the weighted adjacency
//      list of the shortest-paths topic)
namespace pr {
struct Edge {
    int to;   // the neighbor this edge leads to
    int w;    // its weight: the cost to traverse it
};
int V;
vector<vector<Edge>> adj;

struct Entry {
    int w;      // the weight of the edge into v
    int v;      // the vertex it reaches
};

struct Greater {                               // the heap's comparison
    bool operator()(const Entry& a, const Entry& b) const {
        if (a.w != b.w) return a.w > b.w;      // heavier compares greater
        return a.v > b.v;                      // equal weights: by vertex
    }
};

priority_queue<Entry, vector<Entry>, Greater> pq;   // lightest on top

long prim(int s) {                             // adj: the weighted lists
    vector<bool> inTree(V, false);
    priority_queue<Entry, vector<Entry>, Greater> pq;
    long total = 0;
    pq.push({0, s});                           // s joins at no cost
    while (!pq.empty()) {
        Entry top = pq.top();                  // the lightest candidate
        pq.pop();
        int u = top.v;
        if (inTree[u]) continue;               // stale: u is already in
        inTree[u] = true;                      // take the edge into u
        total += top.w;
        for (Edge e : adj[u])
            if (!inTree[e.to]) pq.push({e.w, e.to});
    }
    return total;
}

// the slide's heap declaration (the global pq above), and its tie rule
void declareHeap() {
    pq.push({5, 3}); pq.push({4, 1}); pq.push({6, 3}); pq.push({4, 0});
    assert(pq.top().w == 4 && pq.top().v == 0);   // equal weights: the smaller vertex first
}

// the same loop, printing each pop and the heap after it, and the join order
long primTraced(int s, vector<int>& order, vector<string>& rows) {
    vector<bool> inTree(V, false);
    priority_queue<Entry, vector<Entry>, Greater> pq;
    long total = 0;
    pq.push({0, s});
    while (!pq.empty()) {
        Entry top = pq.top();
        pq.pop();
        int u = top.v;
        string row = "(" + to_string(top.w) + ", " + to_string(u) + ") | ";
        if (inTree[u]) row += "stale: skip";
        else {
            inTree[u] = true;  total += top.w;  order.push_back(u);
            for (Edge e : adj[u])
                if (!inTree[e.to]) pq.push({e.w, e.to});
            row += to_string(u) + " joins";
        }
        row += " | " + to_string(total) + " |";
        priority_queue<Entry, vector<Entry>, Greater> copy = pq;
        if (copy.empty()) row += " empty";
        while (!copy.empty()) { row += " (" + to_string(copy.top().w) + ", " + to_string(copy.top().v) + ")"; copy.pop(); }
        rows.push_back(row);
    }
    return total;
}

// Dijkstra (the shortest-paths topic's lazy version), returning each vertex's parent
vector<int> dijkstraParents(int s) {
    vector<long> dist(V, LONG_MAX); vector<bool> settled(V, false); vector<int> parent(V, -1);
    priority_queue<pair<long, int>, vector<pair<long, int>>, greater<pair<long, int>>> pq;
    dist[s] = 0; pq.push({0, s});
    while (!pq.empty()) {
        int u = pq.top().second; pq.pop();
        if (settled[u]) continue;
        settled[u] = true;
        for (Edge e : adj[u])
            if (!settled[e.to] && dist[u] + e.w < dist[e.to]) { dist[e.to] = dist[u] + e.w; parent[e.to] = u; pq.push({dist[e.to], e.to}); }
    }
    return parent;
}
void load(int n, const vector<vector<int>>& triples) {
    V = n; adj.assign(n, {});
    for (const auto& t : triples) { adj[t[0]].push_back({t[1], t[2]}); adj[t[1]].push_back({t[0], t[2]}); }
}
}  // namespace pr

// ---- slide "Prim with an array" (the appendix topic prim-array) ----------------------
long primArray(const vector<vector<int>>& w, int s) {  // w[u][v], INF: none
    int n = w.size();
    vector<int> best(n, INF);  vector<bool> inTree(n, false);
    best[s] = 0;  long total = 0;
    for (int round = 0; round < n; round++) {
        int u = -1;                           // the nearest outside vertex
        for (int v = 0; v < n; v++)
            if (!inTree[v] && (u == -1 || best[v] < best[u])) u = v;
        if (best[u] == INF) break;            // the rest is unreachable
        inTree[u] = true;  total += best[u];
        for (int v = 0; v < n; v++)           // cheaper ways in through u
            if (!inTree[v] && w[u][v] < best[v]) best[v] = w[u][v];
    }
    return total;
}

string name(int u, int v) { return to_string(min(u, v)) + "-" + to_string(max(u, v)); }

int main() {
    // Kruskal on the course graph: the examined edges, the two skips, the stop at 7 edges
    vector<kr::Edge> es;
    for (const auto& t : COURSE) es.push_back({t[0], t[1], t[2]});
    vector<kr::Edge> mst = kr::kruskal(8, es);
    long total = 0; string got;
    for (const auto& e : mst) { total += e.w; got += name(e.u, e.v) + " "; }
    cout << "kruskal: " << got << "total " << total << "\n";
    assert(got == "1-2 3-4 4-5 0-1 1-3 4-7 5-6 " && total == 31);
    // the skips: replay the sorted order against a fresh union-find
    {
        vector<kr::Edge> s = es; sort(s.begin(), s.end(), kr::lighter);
        UF uf(8); string skips; int added = 0, examined = 0;
        for (const auto& e : s) {
            if (added == 7) break;
            examined++;
            if (!uf.unite(e.u, e.v)) skips += name(e.u, e.v) + " "; else added++;
        }
        cout << "kruskal skips: " << skips << "examined " << examined << "\n";
        assert(skips == "0-3 2-3 " && examined == 9);
    }
    // the demo's edit: 1-3 raised to 9 gives 32
    {
        vector<kr::Edge> e2 = es;
        for (auto& e : e2) if (e.u == 1 && e.v == 3) e.w = 9;
        long t2 = 0; for (const auto& e : kr::kruskal(8, e2)) t2 += e.w;
        cout << "kruskal with 1-3 at 9: " << t2 << "\n";
        assert(t2 == 32);
    }
    // a disconnected graph: a forest of V - c = 3 edges, weight 6
    {
        vector<kr::Edge> f = {{0, 1, 1}, {1, 2, 2}, {3, 4, 3}, {0, 2, 4}};
        auto fm = kr::kruskal(5, f);
        long t3 = 0; for (const auto& e : fm) t3 += e.w;
        assert(fm.size() == 3 && t3 == 6);
    }

    // Prim from 0: the slide's code, the traced copy, and the join order
    pr::declareHeap();
    pr::load(8, COURSE);
    long p = pr::prim(0);
    vector<int> order; vector<string> rows;
    long pt = pr::primTraced(0, order, rows);
    cout << "prim from 0: total " << p << "\n";
    for (const auto& r : rows) cout << "  | " << r << "\n";
    assert(p == 31 && pt == 31 && rows.size() == 12);
    string ord; for (int v : order) ord += to_string(v) + " ";
    assert(ord == "0 1 2 3 4 5 7 6 ");
    // from 6: the same total, the order 6 5 4 3 ...
    vector<int> order6; vector<string> rows6;
    assert(pr::primTraced(6, order6, rows6) == 31 && order6[0] == 6 && order6[1] == 5 && order6[2] == 4 && order6[3] == 3);

    // the shortest-path tree from 0 against the MST: they differ at one edge (0-3 against 1-3)
    vector<int> par = pr::dijkstraParents(0);
    vector<string> spt;
    for (int v = 1; v < 8; v++) spt.push_back(name(par[v], v));
    sort(spt.begin(), spt.end());
    string s; for (auto& x : spt) s += x + " ";
    cout << "shortest-path tree from 0: " << s << "\n";
    assert(s == "0-1 0-3 1-2 3-4 4-5 4-7 5-6 ");
    // the triangle: MST 4, shortest-path tree keeps 0-2
    pr::load(3, {{0, 1, 2}, {1, 2, 2}, {0, 2, 3}});
    assert(pr::prim(0) == 4 && pr::dijkstraParents(0)[2] == 0);

    // Prim without a heap on the course graph's matrix
    vector<vector<int>> w(8, vector<int>(8, INF));
    for (const auto& t : COURSE) w[t[0]][t[1]] = w[t[1]][t[0]] = t[2];
    long pa = primArray(w, 0);
    cout << "primArray: " << pa << "\n";
    assert(pa == 31);
    // and on a disconnected input: only the start's component
    vector<vector<int>> w2(5, vector<int>(5, INF));
    for (auto t : vector<vector<int>>{{0, 1, 1}, {1, 2, 2}, {3, 4, 3}, {0, 2, 4}}) w2[t[0]][t[1]] = w2[t[1]][t[0]] = t[2];
    assert(primArray(w2, 0) == 3 && primArray(w2, 4) == 3);
    cout << "mst: all slide numbers check\n";
}
