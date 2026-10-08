// CSS 343 - PA2: GraphL implementation skeleton. Every method is a TODO.
#include "graphl.h"
#include <stack>
#include <queue>

GraphL::GraphL() {}

GraphL::~GraphL() {
    // TODO: free everything this object owns. Valgrind must report no leaks.
}

int GraphL::buildGraph(ifstream& file) {
    // TODO: buildGraph may be called on an object that already holds a graph.
    //       Read one graph (weights are read and ignored), inserting each new
    //       EdgeNode at the HEAD of its list, and stop right after the
    //       terminating 0 line.
    (void)file;
    return -1;
}

int GraphL::getSize() const { return size; }

string GraphL::edgeList(int nodeId) const {
    (void)nodeId;
    return "";    // TODO: adjacent ids in list order, space-separated
}

int GraphL::displayGraph() const {
    // TODO: "Graph:" then per node: "Node i      name" and one
    //       "  edge i j" line per EdgeNode, in list order (see expected-output.txt)
    return -1;
}

string GraphL::DFSorder(int start) {
    // TODO: ITERATIVE, with an explicit stack. Push start. Then repeatedly:
    //       pop u; if u is already visited, skip it; otherwise visit u and push
    //       its unvisited neighbors in list order. Recursion is not accepted.
    (void)start;
    return "";
}

string GraphL::BFSorder(int start) {
    // TODO: a queue; a vertex is marked visited when it is ENQUEUED.
    (void)start;
    return "";
}
