// CSS 343 - program: same operation count, different running time.
//
// Two experiments, each doing EXACTLY the same number of additions both ways:
//   1. sum an n x n matrix by rows, then by columns
//   2. sum a linked list whose nodes sit in memory in list order, then one
//      whose nodes are scattered (the same values, linked in a shuffled order)
// The counts are identical; only the order of memory accesses differs.
//
// Build & run:  g++ -std=c++17 -O2 locality.cpp -o locality && ./locality

#include <cstdio>
#include <cstdint>
#include <vector>
#include <chrono>
using namespace std;

static uint64_t rng = 88172645463325252ull;
static uint64_t nextRand() { rng ^= rng << 13; rng ^= rng >> 7; rng ^= rng << 17; return rng; }

template <class F> static double seconds(F f) {
    auto t0 = chrono::steady_clock::now(); f();
    return chrono::duration<double>(chrono::steady_clock::now() - t0).count();
}

struct Node { long value; Node* next; };

int main() {
    // ---- 1. matrix: rows vs columns --------------------------------------
    const size_t n = 8192;                               // 8192 x 8192 ints = 256 MiB
    vector<int> m(n * n);
    for (size_t i = 0; i < n * n; i++) m[i] = (int)(i % 7);
    long sumR = 0, sumC = 0;
    double tr = seconds([&] { for (size_t r = 0; r < n; r++) for (size_t c = 0; c < n; c++) sumR += m[r * n + c]; });
    double tc = seconds([&] { for (size_t c = 0; c < n; c++) for (size_t r = 0; r < n; r++) sumC += m[r * n + c]; });
    printf("matrix %zu x %zu (%zu additions each way)\n", n, n, n * n);
    printf("  by rows     %7.3f s   sum %ld\n", tr, sumR);
    printf("  by columns  %7.3f s   sum %ld   (%.1fx slower)\n\n", tc, sumC, tc / tr);

    // ---- 2. linked list: nodes in order vs scattered ------------------------
    const size_t N = 1 << 24;                            // 16,777,216 nodes, 16 bytes each = 256 MiB
    vector<Node> pool(N);
    vector<uint32_t> order(N);
    for (size_t i = 0; i < N; i++) { pool[i].value = (long)(i % 7); order[i] = (uint32_t)i; }
    auto link = [&](const vector<uint32_t>& ord) {
        for (size_t k = 0; k + 1 < N; k++) pool[ord[k]].next = &pool[ord[k + 1]];
        pool[ord[N - 1]].next = nullptr;
        return &pool[ord[0]];
    };
    auto walk = [](Node* h) { long s = 0; for (Node* p = h; p; p = p->next) s += p->value; return s; };
    long s1 = 0, s2 = 0;
    Node* h = link(order);                               // node k is followed by node k + 1
    double ts = seconds([&] { s1 = walk(h); });
    for (size_t i = N - 1; i > 0; i--) { size_t j = nextRand() % (i + 1); uint32_t t = order[i]; order[i] = order[j]; order[j] = t; }
    h = link(order);                                     // same nodes, shuffled order
    double tx = seconds([&] { s2 = walk(h); });
    printf("linked list of %zu nodes (%zu additions each way)\n", N, N);
    printf("  in memory order  %7.3f s   sum %ld\n", ts, s1);
    printf("  scattered        %7.3f s   sum %ld   (%.1fx slower)\n", tx, s2, tx / ts);
}
