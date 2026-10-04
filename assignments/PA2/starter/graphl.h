// CSS 343 · PA2: GraphL specification.
// Adjacency-LIST graph: an array of GraphNodes, each heading a RAW singly
// linked list of EdgeNodes. Every new edge is INSERTED AT THE HEAD: an O(1)
// insert whose visible consequence is that each node's list holds its edges
// in REVERSE input order. That is the specified behavior, and it fixes the
// DFS and BFS orders exactly (expected-output.txt is computed under this rule).
// DFS must be ITERATIVE with an explicit stack; BFS iterative with a queue.
// This class OWNS heap memory (the destructor frees every EdgeNode), and
// copying is disallowed with = delete: with raw pointers, a compiler-written
// copy would free the same nodes twice. PA1 answered the Rule of Three by
// implementing deep copies; deleting the operations is the other legitimate
// answer. Keep the = delete and say why in a comment, or implement a real
// deep copy instead.
#ifndef GRAPHL_H
#define GRAPHL_H
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

struct EdgeNode;
struct GraphNode {
    EdgeNode* edgeHead = nullptr;    // head of this node's edge list
    string data;                     // the vertex name
    bool visited = false;            // scratch mark for DFS/BFS
};
struct EdgeNode {
    int adjGraphNode;                // index of the adjacent vertex
    EdgeNode* nextEdge;
};

class GraphL {
public:
    GraphL();
    ~GraphL();
    GraphL(const GraphL&) = delete;             // raw pointers: forbid shallow copies
    GraphL& operator=(const GraphL&) = delete;

    int    buildGraph(ifstream& file);          // 1 / -1; edge weights in the file are ignored
    int    getSize() const;
    int    displayGraph() const;                // 1 / -1
    string edgeList(int nodeId) const;          // "5 3 2" in list (reverse-input) order
    string DFSorder(int start = 1);             // iterative, explicit stack
    string BFSorder(int start = 1);             // iterative, queue

private:
    GraphNode* nodeArray = nullptr;             // [1..size]; slot 0 unused
    int size = 0;
    // TODO: declare your private helpers
};
#endif
