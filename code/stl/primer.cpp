// CSS 343 - the STL Primer's examples, each checked. Every code block in
// textbook/foundations/foundation-stl-primer.html is copied from this file.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 primer.cpp -o primer
//   run:    ./primer        (prints one line per section and "all checks passed")
#include <algorithm>
#include <climits>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <limits>
#include <list>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <stack>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;

int failures = 0;
void check(bool ok, const string& what) {
    if (!ok) { cout << "FAILED: " << what << "\n"; failures++; }
}
string join(const vector<int>& v) {
    string s;
    for (int x : v) s += (s.empty() ? "" : " ") + to_string(x);
    return s;
}

// 1. Ranges and iterators
void ranges() {
    vector<int> v = {7, 3, 9, 4, 1};
    sort(v.begin(), v.begin() + 3);   // sorts v[0..3): 3 7 9 4 1
    check(join(v) == "3 7 9 4 1", "a half-open range");
    int sum = 0;
    for (const int& x : v) sum += x;  // visits begin() up to, not including, end()
    check(sum == 24, "range-for");
    check(v.end() - v.begin() == 5, "end - begin = size");
    cout << "ranges: " << join(v) << "\n";
}

// 2. vector and string
void vectors() {
    vector<int> dist;
    dist.assign(5, INT_MAX);          // five elements, each INT_MAX
    dist.push_back(0);                // amortized O(1): size 6
    dist.resize(3);                   // keeps the first three
    int last = dist.back();           // INT_MAX
    check(dist.size() == 3 && last == INT_MAX, "assign, push_back, resize, back");

    string path = "10";
    path += "1";                      // "101": amortized O(1) per character
    string tail = path.substr(1);     // "01": a copy, O(length)
    check(path == "101" && tail == "01", "string");
    cout << "vector: size " << dist.size() << ", string " << path << " " << tail << "\n";
}

// 3. pair
void pairs() {
    pair<int, int> e = {4, 2};        // (weight, vertex)
    int w = e.first, u = e.second;    // 4, 2
    bool before = pair<int, int>{4, 2} < pair<int, int>{4, 7};   // true
    check(w == 4 && u == 2 && before, "pair");
    cout << "pair: " << w << " " << u << " " << before << "\n";
}

// 4. stack
void stacks() {
    stack<int> st;
    st.push(1); st.push(2); st.push(3);
    int t = st.top();                 // 3: the last one pushed
    st.pop();                         // removes the 3; returns nothing
    check(t == 3 && st.top() == 2 && st.size() == 2, "stack");
    cout << "stack: top " << t << ", then " << st.top() << "\n";
}

// 5. queue
void queues() {
    queue<int> q;
    q.push(1); q.push(2); q.push(3);
    int f = q.front();                // 1: the first one pushed
    q.pop();                          // removes the 1; returns nothing
    check(f == 1 && q.front() == 2 && q.back() == 3, "queue");
    cout << "queue: front " << f << ", then " << q.front() << "\n";
}

// 6. list
void lists() {
    list<int> chain = {4, 9};
    chain.push_front(1);              // 1 4 9: O(1)
    chain.remove(4);                  // 1 9: O(n) to find, O(1) to unlink
    check(chain.size() == 2 && chain.front() == 1 && chain.back() == 9, "list");
    cout << "list: " << chain.front() << " " << chain.back() << "\n";
}

// 7. priority_queue
struct Greater {                      // reverses the comparison
    bool operator()(int a, int b) const { return a > b; }
};

void heaps() {
    priority_queue<int> maxPQ;                          // the largest on top
    for (int x : {5, 1, 8, 3, 9, 2}) maxPQ.push(x);
    int top = maxPQ.top();                              // 9
    priority_queue<int, vector<int>, Greater> minPQ;    // the smallest on top
    for (int x : {5, 1, 8, 3, 9, 2}) minPQ.push(x);
    int low = minPQ.top();                              // 1
    check(top == 9 && low == 1, "priority_queue");
    vector<int> order;
    while (!minPQ.empty()) { order.push_back(minPQ.top()); minPQ.pop(); }
    check(join(order) == "1 2 3 5 8 9", "min-heap order");
    priority_queue<int, vector<int>, greater<int>> same;   // the library's version
    same.push(4); same.push(2);
    check(same.top() == 2, "std::greater");
    cout << "priority_queue: max " << top << ", min " << low << ", " << join(order) << "\n";
}

// 8. map and set
void maps() {
    map<char, string> code;
    code['f'] = "0";                  // insert
    code['a'] = "1100";
    bool has = code.count('z') == 1;  // false
    string w = code['z'];             // "", and 'z' is now a key
    check(!has && w.empty() && code.size() == 3, "map [] inserts");
    string keys;
    for (const pair<const char, string>& kv : code)
        keys += kv.first;             // "afz": sorted by key
    bool found = code.find('q') != code.end();   // false, and nothing inserted
    check(keys == "afz", "map iterates in key order");
    check(!found && code.size() == 3, "map find");

    set<int> seen = {5, 1, 8};
    seen.insert(1);                   // already there: no change
    bool in = seen.count(8) == 1;     // true
    check(in && seen.size() == 3 && *seen.begin() == 1, "set");
    cout << "map: keys " << keys << "; set size " << seen.size() << "\n";
}

// 9. unordered_map and unordered_set
void hashMaps() {
    unordered_map<string, int> index;
    index["the"] = 0;                 // average O(1)
    index["cat"] = 1;
    bool has = index.count("dog") == 1;   // false
    unordered_set<int> visited = {3, 7};
    visited.insert(3);                // already there: no change
    check(!has && index["cat"] == 1 && visited.size() == 2, "unordered");
    cout << "unordered_map: " << index.size() << " keys; unordered_set: " << visited.size() << "\n";
}

// 10. hash
void hashes() {
    size_t h = hash<string>()("cat");     // the value depends on the library
    size_t bucket = h % 13;               // one of 13 slots
    check(bucket < 13 && h == hash<string>()("cat"), "hash");
    cout << "hash: bucket " << bucket << " of 13\n";
}

// 11. sort and stable_sort
struct Edge { int u, v, w; };

bool lighter(const Edge& a, const Edge& b) {
    return a.w < b.w;                 // strict: false when the weights tie
}

void sorting() {
    vector<Edge> edges = {{0, 1, 4}, {1, 2, 1}, {0, 2, 4}};
    stable_sort(edges.begin(), edges.end(), lighter);   // 1-2, then 0-1, 0-2
    check(edges[0].w == 1 && edges[1].v == 1 && edges[2].v == 2, "stable_sort keeps ties in order");
    vector<Edge> again = {{0, 1, 4}, {1, 2, 1}, {0, 2, 4}};
    sort(again.begin(), again.end(), lighter);          // the 4s in either order
    check(again[0].w == 1 && again[1].w == 4 && again[2].w == 4, "sort");
    vector<int> a = {5, 2, 8, 1};
    sort(a.begin(), a.end());                           // no comparison: <
    check(join(a) == "1 2 5 8", "sort with <");
    cout << "sort: " << join(a) << "\n";
}

// 12. small algorithms
void small() {
    int a = 3, b = 8;
    swap(a, b);                           // a = 8, b = 3
    int hi = max(a, b), lo = min(a, b);   // 8, 3
    vector<int> path = {3, 2, 0};
    reverse(path.begin(), path.end());    // 0 2 3
    vector<int> idx(5);
    iota(idx.begin(), idx.end(), 0);      // 0 1 2 3 4
    int d = abs(-7);                      // 7
    check(a == 8 && b == 3 && hi == 8 && lo == 3 && join(path) == "0 2 3"
          && join(idx) == "0 1 2 3 4" && d == 7, "small algorithms");
    cout << "algorithms: " << join(path) << " / " << join(idx) << "\n";
}

// 13. limits
void limits() {
    int INF = INT_MAX;                       // 2147483647: "no path yet"
    long big = numeric_limits<long>::max();  // 9223372036854775807 (64-bit)
    vector<int> dist = {7, INF};
    int w = 5;
    if (dist[1] != INF && dist[1] + w < dist[0])   // test INF before adding
        dist[0] = dist[1] + w;
    check(INF == 2147483647 && big > INF && dist[0] == 7, "limits");
    cout << "limits: " << INF << " " << big << "\n";
}

int main() {
    ranges(); vectors(); pairs(); stacks(); queues(); lists(); heaps();
    maps(); hashMaps(); hashes(); sorting(); small(); limits();
    if (failures == 0) cout << "all checks passed\n";
    return failures == 0 ? 0 : 1;
}
