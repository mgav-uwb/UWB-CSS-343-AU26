// CSS 343 · PA2: GraphM specification.
// Adjacency-MATRIX graph with ALL-PAIRS Dijkstra in the O(V^2)-per-source
// linear-scan form (no priority queue anywhere), plus path reconstruction
// through prev_node. Part 4 of the assignment races it against your
// Homework 6 heap-based dijkstra.
// Vertices are 1-indexed; row and column 0 are unused, matching the file format.
// The public surface is FIXED (the given driver and our grading driver
// compile against it); add private helpers as needed.
#ifndef GRAPHM_H
#define GRAPHM_H
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
using namespace std;

const int INF = 1000000000;          // "no edge / unknown distance" sentinel

struct TableType {
    bool visited = false;            // settled by Dijkstra?
    int  dist    = INF;              // best distance from the row's source so far
    int  prev_node = 0;              // predecessor on that best path (0 = none)
};

class GraphM {
public:
    GraphM();
    int  buildGraph(ifstream& file);            // 1 on success, -1 on failure
    int  insertEdge(int from, int to, int cost);// 1 / -1 (validates range, cost, self-loop)
    int  removeEdge(int from, int to);          // 1 / -1
    void findShortestPath();                    // all-pairs: Dijkstra from every source
    void displayAllPaths() const;
    void displayPath(int src, int dest) const;
    int  getSize() const;
    int  getDist(int from, int to) const;       // INF if unreachable or out of range
    string getPath(int from, int to) const;     // "1 3 2" (space-separated), "" if none

    // EXTRA CREDIT (keep the given stub if you do not attempt it): the total
    // weight of a minimum spanning tree, treating every edge as UNDIRECTED
    // (when both u->v and v->u exist, the cheaper one counts); -1 if the
    // undirected graph is not connected or has no vertices.
    long long findMST() const;

private:
    vector<string> vertices;                    // [1..size]
    vector<vector<int>> adjM;                   // [1..size][1..size], INF = no edge
    vector<vector<TableType>> pathM;            // pathM[src][v]
    int size = 0;
    // TODO: declare your private helpers
};
#endif
