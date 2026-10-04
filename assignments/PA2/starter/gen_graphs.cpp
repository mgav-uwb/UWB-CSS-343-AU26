// CSS 343 · PA2: Part 4 graph generator (GIVEN).
//   g++ -std=c++17 -O2 gen_graphs.cpp -o gen && ./gen
// Writes dense_V.txt and sparse_V.txt for V = 200, 400, 800, 1600 in the PA2
// file format (fixed seed: everyone measures the same graphs):
//   dense:  every ordered pair gets an edge with probability 1/2  (E ~ V^2/2)
//   sparse: 4 out-edges per vertex                                 (E ~ 4V)
// Race the two Dijkstras over these with race.cpp: GraphM's linear-scan
// all-pairs vs your Homework 6 heap-based dijkstra looped over every source.
#include <fstream>
#include <string>
using namespace std;

int main() {
    unsigned s = 343;
    auto rnd = [&]() { s = s * 1103515245u + 12345u; return (s >> 16) % 32768u; };
    for (int V : {200, 400, 800, 1600}) {
        for (int dense = 0; dense < 2; dense++) {
            ofstream f((dense ? "dense_" : "sparse_") + to_string(V) + ".txt");
            f << V << '\n';
            for (int i = 1; i <= V; i++) f << "v" << i << '\n';
            if (dense) {
                for (int u = 1; u <= V; u++)
                    for (int v = 1; v <= V; v++)
                        if (u != v && rnd() % 2 == 0)
                            f << u << ' ' << v << ' ' << (1 + rnd() % 99) << '\n';
            } else {
                for (int u = 1; u <= V; u++)
                    for (int k = 0; k < 4; k++) {
                        int v = 1 + (int)(rnd() % V);
                        if (v != u) f << u << ' ' << v << ' ' << (1 + rnd() % 99) << '\n';
                    }
            }
            f << "0 0 0\n";
        }
    }
    return 0;
}
