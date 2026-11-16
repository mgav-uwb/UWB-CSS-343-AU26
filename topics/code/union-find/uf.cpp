// CSS 343 · topic union-find: every C++ block on its slides, verbatim, compiled and run
// on the slides' examples. Each variant lives in its own namespace, because the slides
// give find and unite three times over. Every number a slide quotes is asserted.
//
//   g++ -std=c++17 -Wall -Wextra -fsanitize=address,undefined -g uf.cpp -o uf && ./uf
#include <cassert>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

// ---- slide "Quick-find (eager)" ---------------------------------------------------
namespace quickfind {
vector<int> id;
int n;
bool connected(int p, int q) { return id[p] == id[q]; }   // O(1)

void unite(int p, int q) {                                 // O(n)
    int from = id[p], to = id[q];
    for (int i = 0; i < n; i++)                // every entry, every time
        if (id[i] == from) id[i] = to;
}
}  // namespace quickfind

// ---- slide "Quick-union (lazy)" ---------------------------------------------------
namespace quickunion {
vector<int> parent;
int find(int p) {
    while (p != parent[p]) p = parent[p];   // walk up to the root
    return p;
}
void unite(int p, int q) {
    parent[find(p)] = find(q);              // root under root: one write
}
}  // namespace quickunion

// ---- slide "The structure: two arrays", with the weighted unite and full compression
namespace twoarrays {
struct UF {
    vector<int> parent, size;
    UF(int n) : parent(n), size(n, 1) {
        for (int i = 0; i < n; i++) parent[i] = i;   // n singleton sets
    }
    int  find(int x);              // the root of x's tree
    bool unite(int a, int b);      // false if a and b were already one set
    bool connected(int a, int b) { return find(a) == find(b); }
};
int UF::find(int x) { if (parent[x] == x) return x; return parent[x] = find(parent[x]); }
bool UF::unite(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return false;
    if (size[ra] < size[rb]) swap(ra, rb);
    parent[rb] = ra;
    size[ra] += size[rb];
    return true;
}
}  // namespace twoarrays

// ---- slides "Weighted quick-union" and "Path compression" (full) ------------------
namespace full {
struct UF {
    vector<int> parent, size;
    UF(int n) : parent(n), size(n, 1) { for (int i = 0; i < n; i++) parent[i] = i; }
int find(int x) {
    if (parent[x] == x) return x;       // x is the root
    parent[x] = find(parent[x]);        // point x at the root
    return parent[x];
}
bool unite(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return false;                // already one set
    if (size[ra] < size[rb]) swap(ra, rb);     // ra: the larger root
    parent[rb] = ra;                           // smaller under larger
    size[ra] += size[rb];
    return true;
}
    bool connected(int a, int b) { return find(a) == find(b); }
};
}  // namespace full

// ---- slide "Path halving: one pass, no stack" -------------------------------------
namespace halving {
vector<int> parent;
int find(int x) {
    while (x != parent[x]) {
        parent[x] = parent[parent[x]];  // point x at its grandparent
        x = parent[x];
    }
    return x;
}
}  // namespace halving

// ---- slide "Connected components, online" -----------------------------------------
struct Edge { int u, v, w; };
int countComponents(int V, const vector<Edge>& edges) {
    using full::UF;
UF uf(V);
for (const Edge& e : edges) uf.unite(e.u, e.v);   // each set: a component
int components = 0;
for (int v = 0; v < V; v++)
    if (uf.find(v) == v) components++;            // one root per set
    return components;
}

string str(const vector<int>& a) {
    string s;
    for (size_t i = 0; i < a.size(); i++) s += (i ? " " : "") + to_string(a[i]);
    return s;
}
int depth(const vector<int>& parent, int x) { int d = 0; while (parent[x] != x) { x = parent[x]; d++; } return d; }
int height(const vector<int>& parent) { int h = 0; for (int i = 0; i < (int)parent.size(); i++) h = max(h, depth(parent, i)); return h; }

int main() {
    // Quick-find, worked: id after unite(1, 4), unite(2, 3), unite(4, 3)
    quickfind::n = 6; quickfind::id = {0, 1, 2, 3, 4, 5};
    quickfind::unite(1, 4); cout << "quick-find  unite(1,4): " << str(quickfind::id) << "\n"; assert(str(quickfind::id) == "0 4 2 3 4 5");
    quickfind::unite(2, 3); cout << "quick-find  unite(2,3): " << str(quickfind::id) << "\n"; assert(str(quickfind::id) == "0 4 3 3 4 5");
    quickfind::unite(4, 3); cout << "quick-find  unite(4,3): " << str(quickfind::id) << "\n"; assert(str(quickfind::id) == "0 3 3 3 3 5");
    assert(quickfind::connected(1, 2) && !quickfind::connected(0, 5));

    // Quick-union, worked, and the forest
    quickunion::parent = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
    const vector<pair<int, int>> ops = {{4, 3}, {3, 8}, {6, 5}, {9, 4}};
    const vector<string> want = {"0 1 2 3 3 5 6 7 8 9", "0 1 2 8 3 5 6 7 8 9", "0 1 2 8 3 5 5 7 8 9", "0 1 2 8 3 5 5 7 8 8"};
    for (size_t i = 0; i < ops.size(); i++) {
        quickunion::unite(ops[i].first, ops[i].second);
        cout << "quick-union unite(" << ops[i].first << "," << ops[i].second << "): " << str(quickunion::parent) << "\n";
        assert(str(quickunion::parent) == want[i]);
    }
    int roots = 0; for (int i = 0; i < 10; i++) roots += quickunion::parent[i] == i;
    assert(roots == 6 && height(quickunion::parent) == 2);

    // Predict: unite(0,1), unite(1,2), ..., unite(8,9) under plain quick-union: a path of height 9
    quickunion::parent = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
    for (int i = 0; i < 9; i++) quickunion::unite(i, i + 1);
    int walk = depth(quickunion::parent, 0);
    cout << "plain chain: height " << height(quickunion::parent) << ", find(0) walks " << walk << "\n";
    assert(height(quickunion::parent) == 9 && walk == 9);

    // Your turn: plain against weighted on unite(4,3), unite(3,8), unite(9,4)
    quickunion::parent = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
    full::UF w(10);
    for (auto [p, q] : vector<pair<int, int>>{{4, 3}, {3, 8}, {9, 4}}) { quickunion::unite(p, q); w.unite(p, q); }
    cout << "your turn: plain height " << height(quickunion::parent) << ", weighted height " << height(w.parent)
         << ", weighted root " << w.find(3) << "\n";
    assert(height(quickunion::parent) == 2 && height(w.parent) == 1 && w.parent[3] == 4 && w.parent[8] == 4 && w.parent[9] == 4);

    // Path compression on the chain 4 -> 3 -> 2 -> 1 -> 0
    full::UF c(5); c.parent = {0, 0, 1, 2, 3};
    assert(c.find(4) == 0);
    cout << "full compression find(4): " << str(c.parent) << "\n";
    assert(str(c.parent) == "0 0 0 0 0");
    halving::parent = {0, 0, 1, 2, 3};
    assert(halving::find(4) == 0);
    cout << "path halving find(4):     " << str(halving::parent) << "\n";
    assert(str(halving::parent) == "0 0 0 2 2" && height(halving::parent) == 2);
    halving::parent = {0, 0, 1, 2, 3, 4, 5};      // Quiz 6, question 2's chain
    halving::find(6);
    assert(str(halving::parent) == "0 0 0 2 2 4 4");

    // The demo's note: unite 2 1, unite 5 0, unite 2 5, then find 0 repoints 0 at 2 in one write
    full::UF d(10);
    d.unite(2, 1); d.unite(5, 0); d.unite(2, 5);
    assert(d.parent[0] == 5 && d.parent[5] == 2 && depth(d.parent, 0) == 2);
    d.find(0);
    assert(d.parent[0] == 2);

    // The tie rule (Homework 7, Quiz 6 question 1): the root of 7's set is 3
    twoarrays::UF t(8);
    for (auto [a, b] : vector<pair<int, int>>{{1, 2}, {3, 4}, {5, 3}, {4, 1}, {6, 7}, {7, 2}}) t.unite(a, b);
    assert(t.find(7) == 3);
    assert(!t.unite(1, 7) && t.unite(0, 1));

    // Connected components of the course graph's edges, plus two isolated vertices 8 and 9
    const vector<Edge> course = {{0, 1, 4}, {0, 3, 6}, {1, 2, 1}, {1, 3, 5}, {2, 3, 8}, {0, 5, 20},
                                 {3, 4, 2}, {3, 7, 11}, {4, 5, 3}, {5, 6, 9}, {4, 7, 7}};
    int comps = countComponents(10, course);
    cout << "components of the course graph on 10 vertices: " << comps << "\n";
    assert(comps == 3);
    cout << "uf: all slide numbers check\n";
}
