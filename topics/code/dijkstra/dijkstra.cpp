// CSS 343, topic dijkstra: every C++ block on its slides, verbatim, compiled and run on
// the slide examples. The settle order and the pops are printed by an instrumented copy
// that must agree with the slide's code. Every number a slide quotes is asserted.
//
//   g++ -std=c++17 -Wall -Wextra -fsanitize=address,undefined -g dijkstra.cpp -o dijkstra && ./dijkstra
#include <cassert>
#include <climits>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

// ---- the weighted adjacency list of the shortest-paths topic ------------------------
struct Edge {
    int to;   // the neighbor this edge leads to
    int w;    // its weight: the cost to traverse it
};
vector<vector<Edge>> adj;      // adj[u] = u's weighted out-edges
int V;
const long INF = LONG_MAX;
vector<long> dist;
vector<bool> settled;

// ---- slide "The heap's entries" ------------------------------------------------------
struct Entry {
    long d;     // the distance to v when pushed
    int v;      // the vertex
};

struct Greater {                               // the heap's comparison
    bool operator()(const Entry& a, const Entry& b) const {
        if (a.d != b.d) return a.d > b.d;      // farther compares greater
        return a.v > b.v;                      // equal distances: by vertex
    }
};

priority_queue<Entry, vector<Entry>, Greater> pq;   // nearest on top

// ---- slide "Dijkstra: the algorithm" (its lines 7-9 are the "Lazy deletion" slide) ----
void dijkstra(int s) {
    dist.assign(V, INF);  settled.assign(V, false);
    dist[s] = 0;
    priority_queue<Entry, vector<Entry>, Greater> pq;   // a min-heap
    pq.push({0, s});
    while (!pq.empty()) {
        Entry top = pq.top();  pq.pop();      // the nearest unsettled
        int u = top.v;
        if (settled[u]) continue;             // a stale entry: skip it
        settled[u] = true;                    // dist[u] is now final
        for (Edge e : adj[u])                 // relax the out-edges
            if (!settled[e.to] && dist[u] + e.w < dist[e.to]) {
                dist[e.to] = dist[u] + e.w;
                pq.push({dist[e.to], e.to});
            }
    }
}

// ---- slide "The array-scan version" -----------------------------------------------------
void dijkstraArray(int s) {                   // no priority queue
    dist.assign(V, INF);  settled.assign(V, false);
    dist[s] = 0;
    for (int round = 0; round < V; round++) {
        int u = -1;                           // the nearest unsettled: O(V)
        for (int x = 0; x < V; x++)
            if (!settled[x] && (u == -1 || dist[x] < dist[u])) u = x;
        if (dist[u] == INF) break;            // the rest is unreachable
        settled[u] = true;
        for (Edge e : adj[u])                 // relax: O(deg u)
            if (dist[u] + e.w < dist[e.to]) dist[e.to] = dist[u] + e.w;
    }
}

// the slide's heap declaration (the global pq above), and its tie rule
void declareHeap() {
    pq.push({5, 3}); pq.push({4, 1}); pq.push({6, 3}); pq.push({4, 0});
    assert(pq.top().d == 4 && pq.top().v == 0);   // equal distances: the smaller vertex
    pq.pop();
    assert(pq.top().d == 4 && pq.top().v == 1);
}

// the same loop, recording every pop ("(d,v)" or "(d,v) skip") and the settle order
string traced(int s, string& order) {
    dist.assign(V, INF);  settled.assign(V, false);
    dist[s] = 0;
    priority_queue<Entry, vector<Entry>, Greater> pq;
    pq.push({0, s});
    string pops;
    while (!pq.empty()) {
        Entry top = pq.top();
        pq.pop();
        int u = top.v;
        pops += "(" + to_string(top.d) + "," + to_string(u) + ")";
        if (settled[u]) { pops += " skip "; continue; }
        pops += " ";
        settled[u] = true;  order += to_string(u) + " ";
        for (Edge e : adj[u])
            if (!settled[e.to] && dist[u] + e.w < dist[e.to]) {
                dist[e.to] = dist[u] + e.w;
                pq.push({dist[e.to], e.to});
            }
    }
    return pops;
}

void load(int n, const vector<vector<int>>& triples) {   // directed u -> v, weight w
    V = n;  adj.assign(n, {});
    for (const vector<int>& t : triples) adj[t[0]].push_back({t[1], t[2]});
}

string show(const vector<long>& d) {
    string out;
    for (long x : d) out += (x == INF ? string("inf") : to_string(x)) + " ";
    return out;
}

int main() {
    declareHeap();

    // "Dijkstra, step by step": dist 0 2 3 6, settle order 0 1 2 3, (5,2) and (9,3) stale
    load(4, {{0, 1, 2}, {0, 2, 5}, {1, 2, 1}, {1, 3, 7}, {2, 3, 3}});
    string order, pops = traced(0, order);
    cout << "worked: " << pops << "| dist " << show(dist) << "\n";
    assert(pops == "(0,0) (2,1) (3,2) (5,2) skip (6,3) (9,3) skip ");
    assert(order == "0 1 2 3 " && show(dist) == "0 2 3 6 ");
    dijkstra(0);  assert(show(dist) == "0 2 3 6 ");
    dijkstraArray(0);  assert(show(dist) == "0 2 3 6 ");

    // "Practice: settle order": 2 settles 2nd, dist[1] = 3, then 1 (3), then 3 (6)
    load(4, {{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 3}});
    order = "";  traced(0, order);
    assert(order == "0 2 1 3 " && dist[1] == 3 && dist[3] == 6);
    dijkstra(0);  assert(dist[1] == 3 && dist[3] == 6);

    // "Your turn: the course graph": 2 settles 3rd, dist[5] = 11; the notes' full answer
    vector<vector<int>> course = {{0, 1, 4}, {0, 3, 6}, {1, 2, 1}, {1, 3, 5}, {2, 3, 8},
        {0, 5, 20}, {3, 4, 2}, {3, 7, 11}, {4, 5, 3}, {5, 6, 9}, {4, 7, 7}};
    load(8, course);
    order = "";  traced(0, order);
    cout << "course graph: settle order " << order << "| dist " << show(dist) << "\n";
    assert(order == "0 1 2 3 4 5 7 6 " && show(dist) == "0 4 5 6 8 11 20 15 ");
    dijkstra(0);  assert(show(dist) == "0 4 5 6 8 11 20 15 ");
    dijkstraArray(0);  assert(show(dist) == "0 4 5 6 8 11 20 15 ");
    // the demo's notes: from 2, vertices 0 and 1 stay infinite; 0->5 at 8 gives dist[5] = 8
    dijkstra(2);  assert(dist[0] == INF && dist[1] == INF);
    dijkstraArray(2);  assert(dist[0] == INF && dist[1] == INF);
    course[5][2] = 8;  load(8, course);
    dijkstra(0);  assert(dist[5] == 8);
    cout << "dijkstra: all slide numbers check\n";
}
