// CSS 343 · PA1: benchmark workload generator (GIVEN; the single source of
// truth for the benchmark inputs: the grading harness reads the SAME files).
//
//   g++ -std=c++17 -O2 gen_workloads.cpp -o gen && ./gen
//
// Writes workloads/w{1..4}{a,b}.txt: whitespace-separated int keys, one file
// per tree. Build each tree in AVL mode by inserting in FILE ORDER, then merge
// the b-tree into the a-tree. The four workloads probe different regimes:
//   W1 equal         131,072 + 131,072 interleaved evens/odds
//   W2 tiny-into-big 1,048,576 + 1,024   (the m << n regime)
//   W3 overlap       131,072 + 131,072, ~50% shared keys
//   W4 disjoint      [0, 131072) + [200000, 331072)   (concatenation regime)
#include <fstream>
#include <vector>
#include <sys/stat.h>
using namespace std;

static void dump(const string& path, const vector<int>& v) {
    ofstream f(path);
    for (size_t i = 0; i < v.size(); i++) f << v[i] << (i % 16 == 15 ? '\n' : ' ');
    f << '\n';
}

int main() {
    mkdir("workloads", 0755);
    vector<int> a, b;

    // W1: equal, interleaved
    a.clear(); b.clear();
    for (int k = 0; k < 262144; k += 2) a.push_back(k);
    for (int k = 1; k < 262144; k += 2) b.push_back(k);
    dump("workloads/w1a.txt", a); dump("workloads/w1b.txt", b);

    // W2: tiny into big (fixed-seed LCG for the tiny side)
    a.clear(); b.clear();
    for (int k = 0; k < 1048576; k++) a.push_back(k * 2);
    unsigned s = 99;
    for (int i = 0; i < 1024; i++) { s = s * 1103515245u + 12345u; b.push_back((int)((s >> 8) % 2097152u)); }
    dump("workloads/w2a.txt", a); dump("workloads/w2b.txt", b);

    // W3: ~50% overlap
    a.clear(); b.clear();
    for (int k = 0; k < 131072; k++) a.push_back(k * 3);
    for (int k = 65536; k < 196608; k++) b.push_back((k - 65536 < 65536) ? (k - 65536) * 3 : k * 3 + 1);
    dump("workloads/w3a.txt", a); dump("workloads/w3b.txt", b);

    // W4: disjoint ranges
    a.clear(); b.clear();
    for (int k = 0; k < 131072; k++) a.push_back(k);
    for (int k = 200000; k < 331072; k++) b.push_back(k);
    dump("workloads/w4a.txt", a); dump("workloads/w4b.txt", b);
    return 0;
}
