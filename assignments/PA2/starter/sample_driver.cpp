// CSS 343 - PA2: given driver. Exercises BOTH classes on simple_graph.txt,
// which holds TWO graphs: your buildGraph must leave the stream positioned
// for the next one. Its output must match expected-output.txt EXACTLY:
//
//   g++ -std=c++17 -g graphm.cpp graphl.cpp sample_driver.cpp -o pa2
//   ./pa2 > myoutput.txt && diff myoutput.txt expected-output.txt
//   valgrind --leak-check=full ./pa2        (on the CSS lab; GraphL owns heap memory)
//
// This driver is a minimum: it never feeds a bad file, never removes a
// nonexistent edge, never starts a search mid-graph. Your own driver.cpp must
// cover those (the Testing criterion).
#include "graphm.h"
#include "graphl.h"

int main() {
    // ---- GraphM over every graph in the file -------------------------------
    ifstream inM("simple_graph.txt");
    if (!inM) { cout << "simple_graph.txt not found\n"; return 1; }
    int gNo = 0;
    for (;;) {
        GraphM g;
        if (g.buildGraph(inM) != 1) break;
        cout << "=== GraphM - graph " << ++gNo << " (" << g.getSize() << " nodes) ===\n";
        g.findShortestPath();
        g.displayAllPaths();
        if (gNo == 1) {
            cout << "displayPath(1, 4):\n";
            g.displayPath(1, 4);
            cout << "removeEdge(1, 3), recompute:\n";
            g.removeEdge(1, 3);
            g.findShortestPath();
            g.displayPath(1, 4);                       // detour now: 1 5 4 = 55
            cout << "insertEdge(1, 3, 20) restores it:\n";
            g.insertEdge(1, 3, 20);
            g.findShortestPath();
            g.displayPath(1, 4);
        }
    }

    // ---- GraphL over the same file ------------------------------------------
    ifstream inL("simple_graph.txt");
    gNo = 0;
    for (;;) {
        GraphL g;
        if (g.buildGraph(inL) != 1) break;
        cout << "=== GraphL - graph " << ++gNo << " (" << g.getSize() << " nodes) ===\n";
        g.displayGraph();
        cout << "edgeList(1): " << g.edgeList(1) << '\n';
        cout << "DFS from 1:  " << g.DFSorder() << '\n';
        cout << "BFS from 1:  " << g.BFSorder() << '\n';
        cout << '\n';
    }
    return 0;
}
