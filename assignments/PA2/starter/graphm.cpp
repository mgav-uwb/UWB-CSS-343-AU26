// CSS 343 · PA2: GraphM implementation skeleton. Every method is a TODO.
#include "graphm.h"
#include <iomanip>

GraphM::GraphM() {}

int GraphM::buildGraph(ifstream& file) {
    // TODO: read one graph in the format on the assignment page. Vertex names
    //       contain spaces. A repeated edge overwrites the earlier one. Stop
    //       right after this graph's terminating 0 line: the file may hold
    //       another graph, and the next buildGraph call must read it.
    (void)file;
    return -1;
}

int GraphM::insertEdge(int from, int to, int cost) {
    // TODO: -1 for an endpoint outside 1..size, a self-loop, or a negative cost
    (void)from; (void)to; (void)cost;
    return -1;
}

int GraphM::removeEdge(int from, int to) {
    // TODO: -1 for an endpoint outside 1..size
    (void)from; (void)to;
    return -1;
}

void GraphM::findShortestPath() {
    // TODO: Dijkstra from every source into pathM[src], finding the nearest
    //       unsettled vertex by a linear scan (no priority queue).
}

int GraphM::getSize() const { return size; }

int GraphM::getDist(int from, int to) const {
    (void)from; (void)to;
    return INF;   // TODO
}

string GraphM::getPath(int from, int to) const {
    (void)from; (void)to;
    return "";    // TODO: "1 3 2" from source to destination
}

void GraphM::displayAllPaths() const {
    // TODO: match expected-output.txt exactly. One destination line is
    //       "    " << setw(3) << s << setw(5) << t << setw(10) << dist << "  " << path
    //       and an unreachable destination shows --- in the distance column, with no path.
}

void GraphM::displayPath(int src, int dest) const {
    // TODO: the same one-line format, then the NAME of each vertex on the path,
    //       one per line, then a blank line (see expected-output.txt)
    (void)src; (void)dest;
}

long long GraphM::findMST() const {
    return -1;    // EXTRA CREDIT (optional): see graphm.h
}
